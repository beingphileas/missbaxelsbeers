import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { beer_id } = await req.json();
    if (!beer_id) throw new Error("beer_id required");

    // Fetch beer + brewery
    const { data: beer, error: beerErr } = await supabase
      .from("beers")
      .select("*, breweries(*)")
      .eq("id", beer_id)
      .single();
    if (beerErr || !beer) throw new Error("Beer not found");

    const brewery = (beer as any).breweries;
    const beerName = beer.name;
    const breweryName = brewery?.name ?? "Unknown";
    const style = beer.style;
    const abv = beer.abv ?? 0;

    // Firecrawl web search for additional context
    let webContext = "";
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (firecrawlKey) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `"${beerName}" "${breweryName}" beer Belgium tasting notes flavor`,
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData.data ?? searchData.results ?? [];
          webContext = results
            .map((r: any) => `Source: ${r.url}\n${(r.markdown ?? r.description ?? "").slice(0, 800)}`)
            .join("\n---\n")
            .slice(0, 4000);
        }
      } catch (e) {
        console.error("Firecrawl search failed:", e);
      }
    }

    // AI analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analyze this Belgian beer in detail. Return a JSON object (no markdown, no code blocks).

Beer: "${beerName}"
Brewery: "${breweryName}"
Style: "${style}"
ABV: ${abv}%
Existing flavor profile: ${JSON.stringify(beer.flavor_profile ?? [])}
Existing food pairing: ${beer.food_pairing ?? "none"}

Web research context:
${webContext || "No web data available."}

Return this exact JSON structure:
{
  "quality_score": <number 1-100>,
  "summary": "<2-3 sentence summary of the beer>",
  "taste_notes": "<detailed tasting notes paragraph>",
  "radar": {
    "body": <1-5>,
    "hops": <1-5>,
    "malt": <1-5>,
    "fruit": <1-5>,
    "spice": <1-5>
  },
  "primary_flavors": ["<top 3-5 dominant flavors>"],
  "secondary_flavors": ["<3-5 subtle background flavors>"],
  "aroma_profile": ["<3-5 aroma descriptors>"],
  "pairing_food": ["<3-4 general food pairings>"],
  "pairing_classic": ["<2-3 classic Belgian pairings>"],
  "pairing_cheese": ["<2-3 cheese pairings>"],
  "serve_style": "<ideal glass type and temperature>",
  "production_method": "<brewing method notes>"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a Belgian beer expert sommelier. Always return valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI call failed: ${status}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";
    
    // Parse JSON from response (strip possible markdown)
    const jsonStr = rawContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    // Save to DB
    const { error: updateErr } = await supabase.from("beers").update({
      quality_score: analysis.quality_score,
      summary: analysis.summary,
      taste_notes: analysis.taste_notes,
      radar_body: analysis.radar?.body,
      radar_hops: analysis.radar?.hops,
      radar_malt: analysis.radar?.malt,
      radar_fruit: analysis.radar?.fruit,
      radar_spice: analysis.radar?.spice,
      primary_flavors: analysis.primary_flavors,
      secondary_flavors: analysis.secondary_flavors,
      aroma_profile: analysis.aroma_profile,
      pairing_food: analysis.pairing_food,
      pairing_classic: analysis.pairing_classic,
      pairing_cheese: analysis.pairing_cheese,
      serve_style: analysis.serve_style,
      production_method: analysis.production_method,
      analysis_json: analysis,
    }).eq("id", beer_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-beer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
