import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch context from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const [{ data: missbaxelBeers }, { data: breweries }, { data: beers }, { data: posts }] = await Promise.all([
      sb.from("beers")
        .select("id, name, style, abv, description, flavor_profile, primary_flavors, pairing_food, brewery_id")
        .eq("is_current", true)
        .order("name"),
      sb.from("breweries").select("id, name, type, province, story, established_year").order("name"),
      sb.from("beers").select("id, name, style, abv, flavor_profile, food_pairing, is_hidden_gem, brewery_id").order("name"),
      sb.from("blog_posts").select("id, title, slug, excerpt, tags, brewery_id, beer_id").eq("status", "published").order("published_at", { ascending: false }).limit(20),
    ]);

    // Build brewery name map for beers
    const breweryMap: Record<string, string> = {};
    (breweries ?? []).forEach((b: any) => { breweryMap[b.id] = b.name; });

    const missbaxelContext = (missbaxelBeers ?? []).map((b: any) => {
      const flavors = [...(b.primary_flavors || []), ...(b.flavor_profile || [])].filter(Boolean).slice(0, 6).join(", ");
      const pairing = (b.pairing_food || []).slice(0, 3).join(", ");
      const brewer = breweryMap[b.brewery_id] || "onbekend";
      return `- ${b.name} (${b.style || "?"}, ${b.abv ?? "?"}% ABV) — gebrouwen bij ${brewer}${flavors ? ` | smaken: ${flavors}` : ""}${pairing ? ` | past bij: ${pairing}` : ""}${b.description ? ` — ${b.description.slice(0, 140)}` : ""}`;
    }).join("\n");

    const beerContext = (beers ?? []).map((b: any) =>
      `- ${b.name} (${b.style}, ${b.abv}% ABV) by ${breweryMap[b.brewery_id] || "unknown"} — flavors: ${(b.flavor_profile || []).join(", ")}${b.is_hidden_gem ? " ⭐ Hidden Gem" : ""}${b.food_pairing ? ` | food: ${b.food_pairing}` : ""}`
    ).join("\n");

    const breweryContext = (breweries ?? []).map((b: any) =>
      `- ${b.name} (${b.type}, ${b.province})${b.established_year ? ` est. ${b.established_year}` : ""}${b.story ? ` — "${b.story.slice(0, 120)}..."` : ""}`
    ).join("\n");

    const blogContext = (posts ?? []).map((p: any) =>
      `- "${p.title}" [/post/${p.slug}] — ${p.excerpt?.slice(0, 100) || ""} tags: ${(p.tags || []).join(", ")}`
    ).join("\n");

    const systemPrompt = `Je bent de persoonlijke biergids van MissBaxel's Beers, het bierproject van Marijke Bax uit Brugge.
MissBaxel's ontwikkelt biericeeën en werkt samen met Belgische brouwers die de vrije hand krijgen.
De bieren zijn te proeven in restaurant Bij Koen & Marijke in 't Nieuw Museum in Brugge.
Beantwoord vragen over de eigen bieren, de brouwers, bierstijlen en bier-spijs combinaties.
Spreek de gebruiker aan in het Nederlands, tenzij die een andere taal gebruikt.

EIGEN BIEREN VAN MISSBAXEL'S (huidig assortiment):
${missbaxelContext || "(nog geen bieren in de database)"}

ACHTERGROND — Belgische brouwerijen in onze database:
${breweryContext}

ACHTERGROND — andere bieren:
${beerContext}

RECENTE VERHALEN OP DE SITE:
${blogContext}

REGELS:
- Geef voorrang aan MissBaxel's eigen bieren wanneer dat past bij de vraag
- Wees beknopt maar warm — max 3-4 zinnen per aanbeveling
- Noem altijd brouwer, stijl, ABV en waarom het bijzonder is
- Als er een verhaal bestaat, link het als [Titel](/post/slug)
- Verwijs gerust naar restaurant Bij Koen & Marijke om de bieren te proeven
- Verzin geen data die niet in je kennisbasis staat — zeg het eerlijk als je iets niet weet
- Gebruik bier-emoji spaarzaam 🍺`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Even geduld — te veel verzoeken. Probeer het zo opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits zijn op. Neem contact op met de beheerder." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI is momenteel niet beschikbaar." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-whisperer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
