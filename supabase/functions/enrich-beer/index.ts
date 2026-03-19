import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ────────────────────────────────────────────────────────────
// Perplexity helper
// ────────────────────────────────────────────────────────────

async function searchPerplexity(apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ content: string; citations: string[] }> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
    return { content: data.choices?.[0]?.message?.content ?? "", citations: data.citations ?? [] };
  } catch (e) {
    console.error("Perplexity fetch failed:", e);
    return { content: "", citations: [] };
  }
}

// ────────────────────────────────────────────────────────────
// Quality score: 5-pillar system (100 pts)
// ────────────────────────────────────────────────────────────

const MARIJKE_STYLE_PREFS: Record<string, number> = {
  "imperial stout": 3, "pastry stout": 3, "stout": 3, "porter": 3,
  "barley wine": 3, "barleywine": 3,
  "ipa": 3, "west coast ipa": 3, "dipa": 3, "double ipa": 3, "triple ipa": 3,
  "black ipa": 3, "cold ipa": 3, "neipa": 3, "new england ipa": 3, "brut ipa": 3,
  "oude gueuze": 3, "oude geuze": 3, "gueuze": 3, "geuze": 3,
  "oude kriek": 3, "kriek": 3, "oud bruin": 3, "flanders red": 3, "flemish red": 3,
  "wild ale": 3, "gose": 3, "berliner weisse": 3, "lambic": 3, "lambiek": 3,
  "sour": 3, "fruited sour": 3, "fruit lambic": 3, "grape lambic": 3, "druif": 3,
  "tripel": 2, "triple": 2, "belgian strong ale": 2, "belgian strong dark ale": 2,
  "strong ale": 2, "amber": 2, "belgian amber": 2, "winter ale": 2,
  "scotch ale": 2, "bière de garde": 2,
  "saison": 1, "farmhouse": 1, "session ipa": 1, "dubbel": 1, "double": 1,
  "blond": 1, "blonde": 1, "belgian blonde": 1, "belgian ipa": 1,
  "pils": 0, "pilsner": 0, "lager": 0, "radler": 0, "witbier": 0, "wit": 0,
};

function calcUntappdBeerScore(factcheck: any): number {
  const score = factcheck?.external_ratings?.untappd?.score;
  if (typeof score === "number" && score > 0) return (score / 5) * 35;
  return 0;
}

function calcBreweryTypeScore(brewery: any): number {
  const t = (brewery?.type ?? "").toLowerCase();
  if (t.includes("micro") || t.includes("craft") || t.includes("blender") || t.includes("stekerij") || t.includes("lambic") || t.includes("trappist")) return 5;
  if (t.includes("family") || t.includes("abbey") || t.includes("traditional")) return 3;
  if (t.includes("regional") || t.includes("contract")) return 1;
  return 0;
}

function calcBreweryUntappdScore(brewery: any): number {
  const r = brewery?.untappd_rating;
  if (typeof r === "number" && r > 0) return (r / 5) * 10;
  return 0;
}

function calcExternalReviewScore(factcheck: any, brewery: any): number {
  const scores: number[] = []; // normalized to 0-10
  const rb = factcheck?.external_ratings?.ratebeer?.score;
  if (typeof rb === "number" && rb > 0) scores.push(rb / 10); // RateBeer: 0-100 → 0-10
  const ba = factcheck?.external_ratings?.beeradvocate?.score;
  if (typeof ba === "number" && ba > 0) {
    // BeerAdvocate can be 0-5 or 0-100 scale
    const baNorm = ba > 5 ? ba / 10 : ba * 2; // normalize to 0-10
    scores.push(baNorm);
  }
  const goog = brewery?.google_rating;
  if (typeof goog === "number" && goog > 0) scores.push((goog / 5) * 10); // Google: 0-5 → 0-10
  if (scores.length === 0) {
    const untappd = factcheck?.external_ratings?.untappd?.score;
    if (typeof untappd === "number" && untappd > 0) return (untappd / 5) * 30;
    return 0;
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (avg / 10) * 30;
}

function calcMarijkeStyleScore(style: string): number {
  const s = style.toLowerCase();
  let bestFactor = -1;
  for (const [key, factor] of Object.entries(MARIJKE_STYLE_PREFS)) {
    if (s.includes(key) && factor > bestFactor) bestFactor = factor;
  }
  if (bestFactor < 0) bestFactor = 1;
  return (bestFactor / 3) * 12;
}

function calcMarijkeFlavorScore(beer: any, factcheck: any): number {
  const style = (beer.style ?? "").toLowerCase();
  const flavors = [...(beer.primary_flavors ?? []), ...(beer.secondary_flavors ?? []), ...(beer.aroma_profile ?? [])].map((f: string) => f.toLowerCase());
  const notes = ((beer.taste_notes ?? "") + " " + (beer.summary ?? "")).toLowerCase();
  const all = style + " " + flavors.join(" ") + " " + notes;
  let score = 0;
  if (/\b(bitter|hop|hops|hoppy|ipa|resin|piney|citrus hop|dank)\b/.test(all)) score += 2;
  else if (/\b(light.?bitter|mild.?hop)\b/.test(all)) score += 1;
  if (/\b(roast|chocolate|coffee|espresso|dark|stout|porter|char|burnt|cacao|cocoa)\b/.test(all)) score += 2;
  else if (/\b(caramel|toffee|brown|malt)\b/.test(all)) score += 1;
  if (/\b(sour|tart|acetic|lactic|funky|brett|lambic|gueuze|wild|oud bruin|vinous|acidic|zuur)\b/.test(all)) score += 2;
  else if (/\b(tangy|dry)\b/.test(all)) score += 1;
  if (/\b(barrel.?aged|bourbon|whisky|whiskey|smoked|rauch|experimental|vanilla|chili|pepper|cinnamon|spice|grape|druif|macerat|collab)\b/.test(all)) score += 2;
  else if (/\b(oak|wood|herbal|spiced)\b/.test(all)) score += 1;
  return Math.min(8, score);
}

function computeCompositeScore(beer: any, brewery: any, factcheck: any): { total: number | null; breakdown: Record<string, number> } {
  const p1 = calcUntappdBeerScore(factcheck);
  const p2 = calcBreweryTypeScore(brewery);
  const p3 = calcBreweryUntappdScore(brewery);
  const p4 = calcExternalReviewScore(factcheck, brewery);
  const p5 = calcMarijkeStyleScore(beer.style ?? "") + calcMarijkeFlavorScore(beer, factcheck);
  const breakdown = { untappd_beer: p1, brewery_type: p2, brewery_untappd: p3, external_reviews: p4, marijke_taste: p5 };
  console.log(`Score: Untappd=${p1.toFixed(1)}/35, BrewType=${p2}/5, BrewUntappd=${p3.toFixed(1)}/10, External=${p4.toFixed(1)}/30, Marijke=${p5.toFixed(1)}/20`);
  const total = p1 + p2 + p3 + p4 + p5;
  return { total: total < 70 ? null : Math.min(100, Math.round(total * 10) / 10), breakdown };
}

// ────────────────────────────────────────────────────────────
// Variant awareness block (reused in prompts)
// ────────────────────────────────────────────────────────────

function variantBlock(beerName: string, breweryName: string): string {
  return `CRITICAL — VARIANT AWARENESS:
- "${breweryName}" may produce MULTIPLE variants like "${beerName}" (plain), "${beerName}/Kriek", "${beerName} Oogst [year]", "${beerName} BIO". These are DIFFERENT products with different ingredients, ABV, and production methods.
- Focus ONLY on "${beerName}". If you find data for a different variant, clearly label it as such.
- If ABV varies by vintage/blend, list each vintage's ABV separately.
- Individual reviewer opinions should not be presented as verified facts.`;
}

// ────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    const beer_id = body.beer_id;
    // mode: "full" (default) | "analyze" | "factcheck" | "rescore"
    const mode: string = body.mode ?? "full";
    if (!beer_id) throw new Error("beer_id required");

    const { data: beer, error: beerErr } = await supabase.from("beers").select("*, breweries(*)").eq("id", beer_id).single();
    if (beerErr || !beer) throw new Error("Beer not found");

    const brewery = (beer as any).breweries;
    const beerName = beer.name;
    const breweryName = brewery?.name ?? "Unknown";
    const style = beer.style;
    const abv = beer.abv ?? 0;

    // ── RESCORE mode: no API calls, just recalculate from existing data ──
    if (mode === "rescore") {
      const existingFactcheck = beer.factcheck_json as any ?? {};
      const { total, breakdown } = computeCompositeScore(beer, brewery, existingFactcheck);
      existingFactcheck.score_breakdown = breakdown;
      await supabase.from("beers").update({ quality_score: total, factcheck_json: existingFactcheck }).eq("id", beer_id);
      return new Response(JSON.stringify({ success: true, mode: "rescore", quality_score: total, score_breakdown: breakdown }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Perplexity searches (3 queries for full, 2 for analyze-only, 2 for factcheck-only) ──
    const needsAnalysis = mode === "full" || mode === "analyze";
    const needsFactcheck = mode === "full" || mode === "factcheck";

    let webSources: Record<string, string> = {};
    let allCitations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const vBlock = variantBlock(beerName, breweryName);

    if (perplexityKey) {
      const queries: Promise<{ key: string; result: { content: string; citations: string[] } }>[] = [];

      // Query 1: Production & Ingredients (needed for both analysis and factcheck)
      queries.push(
        searchPerplexity(
          perplexityKey,
          "You are a Belgian beer production expert. Provide ONLY officially confirmed data from the brewery, brewery websites, or reputable beer journalism. CRITICAL: NEVER include data from homebrew clone recipes, homebrewing forums, or amateur recipe sites (e.g. BeginBrewing, HomeBrewTalk, BIABrewer, aussiehomebrewer, lawrencebrewers). These are reverse-engineered guesses, NOT real production data. If the brewery does not publicly share mash temperatures, fermentation schedules, or exact hop varieties, say so — do NOT fill in data from clone recipes.",
          `Find OFFICIAL production information about the Belgian beer "${beerName}" by "${breweryName}" (${style}, ${abv}% ABV).

I need ONLY data confirmed by the brewery or reputable beer journalists:
- Ingredients the brewery officially lists (e.g. "water, barley malt, hops, yeast, sugar" — do NOT add specifics unless the brewery names them)
- Fermentation type (top/bottom/spontaneous/mixed) and bottle conditioning — ONLY if confirmed
- General aging method (e.g. "barrel aged", "bottle conditioned") — ONLY if confirmed
- DO NOT include: exact mash temperatures, mash schedules, boil times, hop addition schedules, fermentation temperatures, or conditioning durations UNLESS the brewery itself publishes these
- Verify: is ABV of ${abv}% correct? Is style "${style}" accurate?
- Brewery Untappd rating and review count (for "${breweryName}" overall)

IMPORTANT: If detailed production data is not publicly available (which is the case for most traditional Belgian breweries like Trappists), simply state what IS known and note that the brewery does not disclose further details.

${vBlock}`,
        ).then(r => ({ key: "production", result: r })),
      );

      // Query 2: Tasting, Reviews & Ratings (merged — saves 1 query vs separate)
      queries.push(
        searchPerplexity(
          perplexityKey,
          "You are a Belgian beer tasting and ratings expert. Provide source-based tasting notes AND exact numerical ratings from review platforms. IMPORTANT: distinguish between product variants.",
          `Find ALL tasting information AND ratings for the Belgian beer "${beerName}" by "${breweryName}" (${style}, ${abv}% ABV).

TASTING DATA needed:
- Professional tasting notes (aroma, taste, mouthfeel, finish)
- Specific flavor descriptors (not generic style descriptions)
- Food and cheese pairing recommendations
- Serving temperature, glass type, storage recommendations

RATINGS DATA needed (provide exact scores, review counts, and URLs):
- Untappd: score (0-5), review/check-in count, direct URL
- RateBeer: score (0-100), URL
- BeerAdvocate: score (0-5), URL
- Google Reviews for the brewery
- Any other rating platforms (Vivino for grape beers, etc.)

${vBlock}`,
        ).then(r => ({ key: "tasting_ratings", result: r })),
      );

      // Query 3: Awards & Pricing (only for factcheck modes)
      if (needsFactcheck) {
        queries.push(
          searchPerplexity(
            perplexityKey,
            "You are a beer awards and pricing expert. Provide exact details with years, categories, and sources. Only report awards for the EXACT product requested.",
            `Has the Belgian beer "${beerName}" by "${breweryName}" won any awards, prizes, or medals? What competitions?
What is the retail price in Belgium or Europe? Check beer shops, brewery webshop, and retailers.
Has this beer appeared in notable rankings or best-of lists?

${vBlock}`,
          ).then(r => ({ key: "awards", result: r })),
        );
      }

      const results = await Promise.all(queries);
      for (const { key, result } of results) {
        if (result.content) webSources[key] = result.content;
        allCitations.push(...result.citations);
      }
      allCitations = [...new Set(allCitations)];
      console.log(`Perplexity: ${Object.keys(webSources).length} sections, ${allCitations.length} citations for ${beerName}`);
    }

    // Firecrawl fallback
    if (Object.keys(webSources).length === 0) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (firecrawlKey) {
        try {
          const queries = [
            `"${beerName}" "${breweryName}" Untappd OR RateBeer OR BeerAdvocate rating tasting`,
            `"${beerName}" "${breweryName}" ingredients production brewing`,
          ];
          if (needsFactcheck) queries.push(`"${beerName}" "${breweryName}" award prize price EUR`);
          const allResults: any[] = [];
          for (const q of queries) {
            const res = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ query: q, limit: 3 }),
            });
            if (res.ok) {
              const d = await res.json();
              allResults.push(...(d.data ?? d.results ?? []));
            }
          }
          const fallback = allResults
            .map((r: any) => `URL: ${r.url}\nTitle: ${r.title}\nSnippet: ${(r.description ?? "").slice(0, 400)}`)
            .join("\n---\n").slice(0, 5000);
          if (fallback) webSources["fallback"] = fallback;
        } catch (e) {
          console.error("Firecrawl search failed:", e);
        }
      }
    }

    // ── Build combined web context string ──
    const webContext = Object.entries(webSources)
      .map(([key, content]) => `=== ${key.toUpperCase()} ===\n${content}`)
      .join("\n\n---\n\n");
    const citationBlock = allCitations.length > 0
      ? `\nSource URLs found:\n${allCitations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`
      : "";

    // ── Single AI call that produces both analysis + factcheck ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const analysisBlock = needsAnalysis ? `
  "analysis": {
    "summary": "<2-3 sentence summary based on sources, or null if no data>",
    "taste_notes": "<detailed tasting notes from sources ONLY, or null>",
    "radar": {
      "body": <1-5 or null — NEVER 0>,
      "hops": <1-5 or null — NEVER 0>,
      "malt": <1-5 or null — NEVER 0>,
      "fruit": <1-5 or null — NEVER 0>,
      "spice": <1-5 or null — NEVER 0>
    },
    "primary_flavors": ["<ONLY flavors from sources>"],
    "secondary_flavors": ["<ONLY subtle flavors from sources>"],
    "aroma_profile": ["<ONLY aromas from sources>"],
    "pairing_food": ["<from sources or empty>"],
    "pairing_classic": ["<from sources or empty>"],
    "pairing_cheese": ["<from sources or empty>"],
    "serve_style": "<from sources or null>",
    "production_method": "<ONLY confirmed facts — never invent details>",
    "style_suggestion": "<if sources suggest a more accurate style, otherwise null>",
    "source_confidence": "<high|medium|low>"
  },` : "";

    const factcheckBlock = needsFactcheck ? `
  "factcheck": {
    "confidence_score": <0-100>,
    "variant_note": "<relationship to other variants, or null>",
    "abv_verified": <true only if source confirms>,
    "abv_sources": [<URLs>],
    "abv_range": "<if varies by vintage, e.g. '5.8%-6.6%', otherwise null>",
    "style_verified": <true only if source confirms>,
    "style_note": "<if sources suggest different style, otherwise null>",
    "awards": [<ONLY awards explicitly in sources for THIS product>],
    "price_range": "<ONLY if source mentions price>",
    "external_ratings": {
      "untappd": {"score": <if found>, "url": <if found>, "review_count": <if found>},
      "ratebeer": {"score": <if found>, "url": <if found>},
      "beeradvocate": {"score": <if found>, "url": <if found>}
    },
    "external_links": [<URLs from sources>],
    "production_verified": "<ONLY production facts from sources>",
    "ingredients_verified": "<ONLY ingredients from sources>",
    "issues": [<data inconsistencies>],
    "suggestions": [<improvements based on evidence>]
  },` : "";

    const prompt = `Analyze and verify this Belgian beer STRICTLY based on the web sources below.

CRITICAL RULES:
- ONLY report data EXPLICITLY found in web sources. NEVER invent or guess.
- If data is not found, use null or empty arrays.
- ANTI-HALLUCINATION: Never invent distillery names, barrel brands, ingredient percentages not in sources.
- Radar: use null (not 0) for axes without source data. A gueuze has body — 0 would be misleading.
- Confidence: 80-100 = multiple detailed sources; 50-79 = basic + partial; 20-49 = only basic ID; 0-19 = nothing.

VARIANT AWARENESS:
${vBlock}

Beer: "${beerName}"
Brewery: "${breweryName}"
Style: "${style}"
ABV: ${abv}%
Existing flavors: ${JSON.stringify(beer.flavor_profile ?? [])}

Web sources:
${webContext || "NO WEB SOURCES FOUND — return null/empty for all detail fields."}
${citationBlock}

Return this exact JSON (no markdown):
{${analysisBlock}${factcheckBlock}
  "mode": "${mode}"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a Belgian beer expert. Return valid JSON only. Never invent details not in sources. Radar null not 0. Distinguish variants." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI call failed: ${status}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "";
    const jsonStr = rawContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonStr);

    // ── Process analysis ──
    const updateFields: Record<string, any> = {};

    if (needsAnalysis && result.analysis) {
      const a = result.analysis;
      // Strip if low confidence and no web data
      if (a.source_confidence === "low" && Object.keys(webSources).length === 0) {
        a.taste_notes = null;
        a.radar = { body: null, hops: null, malt: null, fruit: null, spice: null };
        a.primary_flavors = [];
        a.secondary_flavors = [];
        a.aroma_profile = [];
        a.pairing_food = [];
        a.pairing_classic = [];
        a.pairing_cheese = [];
        a.serve_style = null;
        a.production_method = null;
      }
      Object.assign(updateFields, {
        summary: a.summary,
        taste_notes: a.taste_notes,
        radar_body: a.radar?.body,
        radar_hops: a.radar?.hops,
        radar_malt: a.radar?.malt,
        radar_fruit: a.radar?.fruit,
        radar_spice: a.radar?.spice,
        primary_flavors: a.primary_flavors,
        secondary_flavors: a.secondary_flavors,
        aroma_profile: a.aroma_profile,
        pairing_food: a.pairing_food,
        pairing_classic: a.pairing_classic,
        pairing_cheese: a.pairing_cheese,
        serve_style: a.serve_style,
        production_method: a.production_method,
        analysis_json: { ...a, citations: allCitations },
      });
    }

    // ── Process factcheck ──
    if (needsFactcheck && result.factcheck) {
      let fc = result.factcheck;
      // Strip if very low confidence and no web data
      if ((fc.confidence_score ?? 0) <= 10 && Object.keys(webSources).length === 0) {
        fc = {
          confidence_score: fc.confidence_score ?? 0,
          abv_verified: false, abv_sources: [], style_verified: false, style_note: null,
          awards: [], price_range: null,
          external_ratings: { untappd: { score: null, url: null }, ratebeer: { score: null, url: null }, beeradvocate: { score: null, url: null } },
          external_links: [], production_verified: null, ingredients_verified: null,
          issues: [], suggestions: ["Geen betrouwbare bronnen gevonden — handmatige verificatie aanbevolen."],
        };
      }
      fc.citations = allCitations;

      // Compute quality score
      // Use freshly updated beer data for Marijke score if analysis ran
      const beerForScore = needsAnalysis && result.analysis
        ? { ...beer, primary_flavors: result.analysis.primary_flavors, secondary_flavors: result.analysis.secondary_flavors, aroma_profile: result.analysis.aroma_profile, taste_notes: result.analysis.taste_notes, summary: result.analysis.summary }
        : beer;
      const { total, breakdown } = computeCompositeScore(beerForScore, brewery, fc);
      fc.score_breakdown = breakdown;

      Object.assign(updateFields, {
        factcheck_json: fc,
        quality_score: total,
      });

      result.factcheck = fc;
      result.score_breakdown = breakdown;
    }

    // ── Save ──
    if (Object.keys(updateFields).length > 0) {
      const { error: updateErr } = await supabase.from("beers").update(updateFields).eq("id", beer_id);
      if (updateErr) throw updateErr;
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-beer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
