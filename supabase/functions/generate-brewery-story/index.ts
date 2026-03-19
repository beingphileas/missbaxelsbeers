import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth guard
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: claims, error: authErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (authErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { breweryId } = await req.json();
    if (!breweryId) throw new Error("breweryId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brewery + beers
    const { data: brewery, error: bErr } = await supabase
      .from("breweries")
      .select("*")
      .eq("id", breweryId)
      .single();
    if (bErr) throw bErr;

    const { data: beers } = await supabase
      .from("beers")
      .select("name, style, abv, flavor_profile, is_hidden_gem")
      .eq("brewery_id", breweryId);

    const beerList = (beers ?? [])
      .map((b) => `${b.name} (${b.style}, ${b.abv}% ABV, flavors: ${(b.flavor_profile ?? []).join(", ")})`)
      .join("; ");

    const prompt = `Schrijf een unieke, beknopte beschrijving van exact 2 zinnen IN HET ENGELS voor deze Belgische brouwerij:

Naam: ${brewery.name}
Type: ${brewery.type}
Provincie: ${brewery.province}
Adres: ${brewery.address ?? "onbekend"}
Opgericht: ${brewery.established_year ?? "onbekend"}
Bieren: ${beerList || "geen bieren vermeld"}

STRIKTE REGELS:
- Begin NOOIT met "In the heart of", "Nestled in", "Located in" of een andere locatie-openingszin
- Begin direct met de brouwerijnaam of een uniek feit over de brouwerij
- Wees SPECIFIEK: noem concrete bieren, stijlen, technieken of geschiedenis
- Als het een bierfirma is (geen eigen brouwsite), vermeld dat ze laten brouwen
- Als het een geuzestekerij is, focus op het blendproces
- Vermijd vage superlatieven zoals "passion for beer", "artisanal tradition", "unique flavors"
- Schrijf feitelijk en informatief, niet promotioneel
- Maximaal 2 zinnen, geen aanhalingstekens`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a knowledgeable Belgian beer expert and storyteller. Write concise, vivid brewery descriptions in English." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await aiResponse.json();
    const story = result.choices?.[0]?.message?.content?.trim();
    if (!story) throw new Error("No story generated");

    // Save to database
    const { error: updateErr } = await supabase
      .from("breweries")
      .update({ story })
      .eq("id", breweryId);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ story }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-brewery-story error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
