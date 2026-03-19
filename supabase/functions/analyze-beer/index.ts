import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchPerplexity(apiKey: string, systemPrompt: string, userPrompt: string, model = "sonar"): Promise<{ content: string; citations: string[] }> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("Perplexity error:", res.status, await res.text());
      return { content: "", citations: [] };
    }
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      citations: data.citations ?? [],
    };
  } catch (e) {
    console.error("Perplexity fetch failed:", e);
    return { content: "", citations: [] };
  }
}

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

    // Single sonar query (cheap) — AI gateway handles synthesis
    let webContext = "";
    let citations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (perplexityKey) {
      const varBlock = `CRITICAL: Only report data for "${beerName}" specifically, not other variants by "${breweryName}".`;
      const result = await searchPerplexity(
        perplexityKey,
        "You are a Belgian beer expert. Return factual, source-based information only. NEVER include homebrew clone recipe data.",
        `Find information about "${beerName}" by "${breweryName}" (${style}, ${abv}% ABV).

1. Key tasting notes (aroma, taste, finish) — max 6 core flavors from multiple reviews
2. Production: fermentation type, bottle conditioning, listed ingredients (official only, no clone recipes)
3. Food/cheese pairings, serving temp, glass type
4. Ratings: Untappd, RateBeer, BeerAdvocate scores + URLs

${varBlock}`,
        "sonar"
      );

      webContext = result.content;
      citations = [...new Set(result.citations)];
      console.log(`Perplexity sonar: ${webContext.length} chars, ${citations.length} citations for ${beerName}`);
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
              query: `"${beerName}" "${breweryName}" beer Belgium tasting notes flavor ingredients`,
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
- If no specific info is found for a field, use null or empty array — NEVER fill with generic style-based guesses.
- Radar values should reflect what sources describe, not what is "typical for the style". Use null when no source data exists.

PRODUCTION METHOD — CRITICAL:
- NEVER use data from homebrew clone recipes, homebrewing forums, or amateur recipe sites (BeginBrewing, HomeBrewTalk, BIABrewer, aussiehomebrewer, lawrencebrewers, etc.).
- These sites reverse-engineer recipes — their mash temps, fermentation schedules, and hop schedules are GUESSES, not real brewery data.
- Most traditional Belgian breweries (especially Trappists) do NOT publish detailed production data.
- Only include: fermentation type (if confirmed), bottle conditioning (if confirmed), general ingredients listed by the brewery.
- If no official production data exists, write: "Details not publicly disclosed by the brewery."

TASTING NOTES — QUALITY OVER QUANTITY:
- Synthesize a CONCISE profile from multiple agreeing sources. Do NOT concatenate every descriptor from every review.
- Primary flavors: max 5-6 items that MULTIPLE sources consistently mention.
- Aroma profile: max 5-6 items, not every review merged.
- Do NOT include flavors implying production methods not used (e.g. "bourbon burn" for non-barrel-aged beer).
- Individual reviewer opinions or off-notes should NOT appear as general characteristics.

CONFIDENCE SCORING:
- "high" = multiple sources with detailed, specific, verifiable data
- "medium" = basic facts confirmed plus some partial details  
- "low" = only basic identification data or nothing specific found

VARIANT AWARENESS (CRITICAL):
- Base analysis ONLY on data for "${beerName}" specifically. Do NOT merge from other variants.

Beer: "${beerName}"
Brewery: "${breweryName}"
Style (current label): "${style}"
ABV: ${abv}%
Existing flavor profile: ${JSON.stringify(beer.flavor_profile ?? [])}
Existing food pairing: ${beer.food_pairing ?? "none"}

Web research:
${webContext || "No web data available — return null/empty for taste-related fields."}
${citationBlock}

Return this exact JSON structure (no markdown, no code blocks):
{
  "quality_score": <number 1-100, or null if insufficient data>,
  "summary": "<2-3 sentence summary based on sources, or null if no data>",
  "taste_notes": "<concise tasting notes synthesized from multiple agreeing sources. Max 3-4 sentences. Or null>",
  "radar": {
    "body": <1-5 based on source descriptions, or null — NEVER 0>,
    "hops": <1-5 based on source descriptions, or null — NEVER 0>,
    "malt": <1-5 based on source descriptions, or null — NEVER 0>,
    "fruit": <1-5 based on source descriptions, or null — NEVER 0>,
    "spice": <1-5 based on source descriptions, or null — NEVER 0>
  },
  "primary_flavors": ["<Max 5-6 CORE flavors consistently mentioned by multiple sources>"],
  "secondary_flavors": ["<Max 3-4 secondary flavors from multiple sources>"],
  "aroma_profile": ["<Max 5-6 aromas consistently mentioned across sources>"],
  "pairing_food": ["<food pairings from sources, or empty>"],
  "pairing_classic": ["<classic Belgian pairings from sources, or empty>"],
  "pairing_cheese": ["<cheese pairings from sources, or empty>"],
  "serve_style": "<from sources (temperature, glass type, storage), or null>",
  "production_method": "<ONLY brewery-confirmed production facts. Never homebrew clone data. If not publicly disclosed, say so.>",
  "style_suggestion": "<if sources suggest a more accurate style than '${style}', put it here, otherwise null>",
  "source_confidence": "<high|medium|low>"
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
          { role: "system", content: "You are a Belgian beer expert and fact-checker. Return valid JSON only. CRITICAL: Never use homebrew clone recipe data as production facts. Never concatenate all reviews into one giant flavor list — synthesize only consistently mentioned descriptors. Radar null not 0. Production method must only contain brewery-confirmed facts." },
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
    
    console.log(`AI response length: ${rawContent.length}, confidence will be checked`);

    const jsonStr = rawContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    // Only strip if GENUINELY no data (low confidence AND no web context)
    if (analysis.source_confidence === "low" && webContext.length < 100) {
      console.log(`Stripping analysis for ${beerName}: low confidence AND minimal web context`);
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
