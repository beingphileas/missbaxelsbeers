import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchPerplexity(apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ content: string; citations: string[] }> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
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

    // Use Perplexity sonar-pro for comprehensive grounded search
    let webContext = "";
    let citations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (perplexityKey) {
      // Two parallel searches: one for production/ingredients, one for tasting/reviews
      const [prodResult, tasteResult] = await Promise.all([
        searchPerplexity(
          perplexityKey,
          "You are a Belgian beer expert researcher. Provide extremely detailed, factual information. Always include exact data: ingredients, percentages, dates, brewing processes, grape varieties, hop varieties, malt types, fermentation details. Be as specific as possible.",
          `Give me ALL available production details about the Belgian beer "${beerName}" from brewery "${breweryName}" (${style}, ${abv}% ABV). I need:
1. Complete ingredient list (exact malt types, hop varieties, spices, fruits, grape varieties with percentages if available)
2. Brewing/production method (fermentation type, aging, barrel details, maceration, blending, bottle conditioning)
3. Any collaboration details (other breweries, winemakers, farmers)
4. Bottling dates, blend numbers, seasonal details
5. Origin of ingredients (region, terroir)
Be extremely specific and detailed. Include every fact you can find.`,
        ),
        searchPerplexity(
          perplexityKey,
          "You are a Belgian beer tasting expert. Provide detailed, source-based tasting notes. Include specific flavor descriptors, food pairings from experts, serving recommendations. Never generalize.",
          `Give me ALL available tasting information about the Belgian beer "${beerName}" from brewery "${breweryName}" (${style}, ${abv}% ABV). I need:
1. Professional tasting notes and reviewer descriptions (aroma, taste, mouthfeel, finish)
2. Specific flavor descriptors (not generic style descriptions)
3. Food pairing recommendations from experts or the brewery
4. Cheese pairings
5. Serving temperature, glass type, storage recommendations
6. How this beer compares to similar beers or other versions
Include every specific detail you can find. Do NOT use generic style-based descriptions.`,
        ),
      ]);

      const parts: string[] = [];
      if (prodResult.content) parts.push(`PRODUCTION & INGREDIENTS:\n${prodResult.content}`);
      if (tasteResult.content) parts.push(`TASTING & PAIRINGS:\n${tasteResult.content}`);
      webContext = parts.join("\n\n---\n\n");
      citations = [...new Set([...prodResult.citations, ...tasteResult.citations])];

      console.log(`Perplexity returned ${webContext.length} chars, ${citations.length} citations for ${beerName}`);
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
- If the research mentions specific ingredients (e.g. grapes like Pinot d'Aunis, Chenin Blanc, or spices like cardamom, juniper, paradise seed), those MUST appear in primary_flavors, aroma_profile, and taste_notes.
- If the research mentions specific tasting notes from reviewers, use THOSE notes — not generic style descriptions.
- If the research mentions production details (maceration, barrel aging, blending), include them in production_method.
- If no specific info is found for a field, use null or empty array — NEVER fill with generic style-based guesses.
- The radar values should reflect what sources describe, not what is "typical for the style".
- For style: if sources suggest a more specific classification, use the more accurate one.
- IMPORTANT: If sources provide rich data, source_confidence MUST be "high" or "medium". Only use "low" when there is genuinely no source data.

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
  "taste_notes": "<detailed tasting notes from sources, include specific flavors/ingredients mentioned. Or null if no source-based notes available>",
  "radar": {
    "body": <1-5 based on source descriptions, or null>,
    "hops": <1-5 based on source descriptions, or null>,
    "malt": <1-5 based on source descriptions, or null>,
    "fruit": <1-5 based on source descriptions, or null>,
    "spice": <1-5 based on source descriptions, or null>
  },
  "primary_flavors": ["<ONLY flavors explicitly mentioned in sources — include specific grape varieties, spices, ingredients>"],
  "secondary_flavors": ["<ONLY subtle flavors mentioned in sources>"],
  "aroma_profile": ["<ONLY aromas mentioned in sources>"],
  "pairing_food": ["<food pairings from sources, or empty>"],
  "pairing_classic": ["<classic Belgian pairings from sources, or empty>"],
  "pairing_cheese": ["<cheese pairings from sources, or empty>"],
  "serve_style": "<from sources (temperature, glass type, storage), or null>",
  "production_method": "<DETAILED production method from sources: fermentation, maceration, barrel aging, blending, grape varieties with percentages, ingredient origins. Or null if not available>",
  "style_suggestion": "<if sources suggest a more accurate style than '${style}', put it here, otherwise null>",
  "source_confidence": "<high if rich source data available, medium if partial, low ONLY if genuinely no data>"
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
          { role: "system", content: "You are a Belgian beer expert. Return valid JSON only, no markdown. ONLY use data from the provided web research. If information is not in the sources, use null — never guess or generalize. When sources are rich and detailed, make sure source_confidence reflects that." },
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
