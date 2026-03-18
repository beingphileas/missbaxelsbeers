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

    // Use Perplexity for grounded web search
    let webContext = "";
    let citations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (perplexityKey) {
      try {
        const searchRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content: "You are a Belgian beer research assistant. Provide detailed, factual information about the beer. Include: exact ingredients, brewing method, tasting notes from reviewers, style classification, and any unique characteristics. Be specific — never generalize.",
              },
              {
                role: "user",
                content: `Tell me everything you can find about the Belgian beer "${beerName}" from brewery "${breweryName}". Include: ingredients, tasting notes, style details, brewing method, food pairings, and any reviewer descriptions. Be as specific and detailed as possible.`,
              },
            ],
          }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          webContext = searchData.choices?.[0]?.message?.content ?? "";
          citations = searchData.citations ?? [];
        }
      } catch (e) {
        console.error("Perplexity search failed:", e);
      }
    }

    // Fallback to Firecrawl if Perplexity unavailable
    if (!webContext) {
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
    }

    // AI analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const citationBlock = citations.length > 0
      ? `\nCitations:\n${citations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`
      : "";

    const prompt = `Analyze this Belgian beer based STRICTLY on the web research below. 

CRITICAL RULES:
- Use ONLY information from the web research. Do NOT invent or generalize.
- If the research mentions specific ingredients (e.g. cardamom, juniper, paradise seed), those MUST appear in primary_flavors and taste_notes.
- If the research mentions specific tasting notes from reviewers, use THOSE notes — not generic style descriptions.
- If no specific info is found for a field, use null or empty array — NEVER fill with generic style-based guesses.
- The radar values should reflect what sources describe, not what is "typical for the style".
- For style: if sources suggest a more specific classification (e.g. "tripel-achtig" instead of just "blond"), use the more accurate one.

Beer: "${beerName}"
Brewery: "${breweryName}"
Style (current label): "${style}"
ABV: ${abv}%
Existing flavor profile: ${JSON.stringify(beer.flavor_profile ?? [])}
Existing food pairing: ${beer.food_pairing ?? "none"}

Web research (Perplexity grounded search):
${webContext || "No web data available — return null/empty for taste-related fields."}
${citationBlock}

Return this exact JSON structure (no markdown, no code blocks):
{
  "quality_score": <number 1-100, or null if insufficient data>,
  "summary": "<2-3 sentence summary based on sources, or null if no data>",
  "taste_notes": "<detailed tasting notes from sources, or null if no source-based notes available>",
  "radar": {
    "body": <1-5 based on source descriptions, or null>,
    "hops": <1-5 based on source descriptions, or null>,
    "malt": <1-5 based on source descriptions, or null>,
    "fruit": <1-5 based on source descriptions, or null>,
    "spice": <1-5 based on source descriptions, or null>
  },
  "primary_flavors": ["<ONLY flavors explicitly mentioned in sources>"],
  "secondary_flavors": ["<ONLY subtle flavors mentioned in sources>"],
  "aroma_profile": ["<ONLY aromas mentioned in sources>"],
  "pairing_food": ["<food pairings from sources, or empty>"],
  "pairing_classic": ["<classic pairings from sources, or empty>"],
  "pairing_cheese": ["<cheese pairings from sources, or empty>"],
  "serve_style": "<from sources, or null>",
  "production_method": "<from sources, or null>",
  "style_suggestion": "<if sources suggest a more accurate style than '${style}', put it here, otherwise null>",
  "source_confidence": "<high/medium/low based on how much source data was available>"
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
          { role: "system", content: "You are a Belgian beer expert. Return valid JSON only, no markdown. ONLY use data from the provided web research. If information is not in the sources, use null — never guess or generalize." },
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
    
    const jsonStr = rawContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    // If source_confidence is "low", strip taste-related fields to avoid hallucination
    if (analysis.source_confidence === "low") {
      analysis.taste_notes = null;
      analysis.radar = { body: null, hops: null, malt: null, fruit: null, spice: null };
      analysis.primary_flavors = [];
      analysis.secondary_flavors = [];
      analysis.aroma_profile = [];
      analysis.pairing_food = [];
      analysis.pairing_classic = [];
      analysis.pairing_cheese = [];
      analysis.serve_style = null;
      analysis.production_method = null;
    }

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
      analysis_json: { ...analysis, citations },
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
