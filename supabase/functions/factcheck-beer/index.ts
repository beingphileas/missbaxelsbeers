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

// ── 1. Untappd Beer Score (max 35 pts) ──
function calcUntappdBeerScore(factcheck: any): number {
  const score = factcheck.external_ratings?.untappd?.score;
  if (typeof score === "number" && score > 0) return (score / 5) * 35;
  return 0;
}

// ── 2. Brewery Type (max 5 pts) ──
function calcBreweryTypeScore(brewery: any): number {
  const t = (brewery?.type ?? "").toLowerCase();
  if (t.includes("micro") || t.includes("craft") || t.includes("blender") || t.includes("stekerij") || t.includes("lambic") || t.includes("trappist")) return 5;
  if (t.includes("family") || t.includes("abbey") || t.includes("traditional")) return 3;
  if (t.includes("regional") || t.includes("contract")) return 1;
  return 0;
}

// ── 3. Untappd Brewery Score (max 10 pts) ──
function calcBreweryUntappdScore(brewery: any): number {
  const r = brewery?.untappd_rating;
  if (typeof r === "number" && r > 0) return (r / 5) * 10;
  return 0;
}

// ── 4. Other Review Sites (max 30 pts) ──
// If no other review scores exist, Untappd beer score fills this pillar too
function calcExternalReviewScore(factcheck: any, brewery: any): number {
  const scores: number[] = []; // normalised to 0-10

  const rb = factcheck.external_ratings?.ratebeer?.score;
  if (typeof rb === "number" && rb > 0) scores.push(rb / 10); // RateBeer is 0-100

  const ba = factcheck.external_ratings?.beeradvocate?.score;
  if (typeof ba === "number" && ba > 0) scores.push((ba / 5) * 10); // BA is 0-5

  // Google brewery rating as supplemental signal
  const goog = brewery?.google_rating;
  if (typeof goog === "number" && goog > 0) scores.push((goog / 5) * 10);

  // Fallback: if no other review sites found, use Untappd beer score for this pillar
  if (scores.length === 0) {
    const untappd = factcheck.external_ratings?.untappd?.score;
    if (typeof untappd === "number" && untappd > 0) {
      return (untappd / 5) * 30;
    }
    return 0;
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (avg / 10) * 30;
}

// ── 5. Marijke's Taste Profile (max 20 pts) ──
const MARIJKE_STYLE_PREFS: Record<string, number> = {
  // Factor 3 – favourites
  "imperial stout": 3, "pastry stout": 3, "stout": 3, "porter": 3,
  "barley wine": 3, "barleywine": 3,
  "ipa": 3, "west coast ipa": 3, "dipa": 3, "double ipa": 3, "triple ipa": 3,
  "black ipa": 3, "cold ipa": 3, "neipa": 3, "new england ipa": 3, "brut ipa": 3,
  "oude gueuze": 3, "oude geuze": 3, "gueuze": 3, "geuze": 3,
  "oude kriek": 3, "kriek": 3, "oud bruin": 3, "flanders red": 3, "flemish red": 3,
  "wild ale": 3, "gose": 3, "berliner weisse": 3, "lambic": 3, "lambiek": 3,
  "sour": 3, "fruited sour": 3, "fruit lambic": 3, "grape lambic": 3, "druif": 3,
  // Factor 2 – likes
  "tripel": 2, "triple": 2, "belgian strong ale": 2, "belgian strong dark ale": 2,
  "strong ale": 2, "amber": 2, "belgian amber": 2, "winter ale": 2,
  "scotch ale": 2, "bière de garde": 2,
  // Factor 1 – okay
  "saison": 1, "farmhouse": 1, "session ipa": 1, "dubbel": 1, "double": 1,
  "blond": 1, "blonde": 1, "belgian blonde": 1, "belgian ipa": 1,
  // Factor 0 – not her thing
  "pils": 0, "pilsner": 0, "lager": 0, "radler": 0, "witbier": 0, "wit": 0,
};

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
  const flavors = [
    ...(beer.primary_flavors ?? []),
    ...(beer.secondary_flavors ?? []),
    ...(beer.aroma_profile ?? []),
  ].map((f: string) => f.toLowerCase());
  const notes = ((beer.taste_notes ?? "") + " " + (beer.summary ?? "")).toLowerCase();
  const all = style + " " + flavors.join(" ") + " " + notes;

  let score = 0;

  // Axis 1: Bitterheid / hoppig (0-2)
  if (/\b(bitter|hop|hops|hoppy|ipa|resin|piney|citrus hop|dank)\b/.test(all)) score += 2;
  else if (/\b(light.?bitter|mild.?hop)\b/.test(all)) score += 1;

  // Axis 2: Donker & geroosterd (0-2)
  if (/\b(roast|chocolate|coffee|espresso|dark|stout|porter|char|burnt|cacao|cocoa)\b/.test(all)) score += 2;
  else if (/\b(caramel|toffee|brown|malt)\b/.test(all)) score += 1;

  // Axis 3: Zuur / funky (0-2)
  if (/\b(sour|tart|acetic|lactic|funky|brett|lambic|gueuze|wild|oud bruin|vinous|acidic|zuur)\b/.test(all)) score += 2;
  else if (/\b(tangy|dry)\b/.test(all)) score += 1;

  // Axis 4: Experimenteel / barrel aged / gerookt / gekruid (0-2)
  if (/\b(barrel.?aged|bourbon|whisky|whiskey|smoked|rauch|experimental|vanilla|chili|pepper|cinnamon|spice|grape|druif|macerat|collab)\b/.test(all)) score += 2;
  else if (/\b(oak|wood|herbal|spiced)\b/.test(all)) score += 1;

  return Math.min(8, score);
}

function calcMarijkeScore(beer: any, factcheck: any): number {
  return calcMarijkeStyleScore(beer.style ?? "") + calcMarijkeFlavorScore(beer, factcheck);
}

// ── Composite: sum of 5 pillars ──
function computeCompositeScore(beer: any, brewery: any, factcheck: any): number | null {
  const p1 = calcUntappdBeerScore(factcheck);
  const p2 = calcBreweryTypeScore(brewery);
  const p3 = calcBreweryUntappdScore(brewery);
  const p4 = calcExternalReviewScore(factcheck, brewery);
  const p5 = calcMarijkeScore(beer, factcheck);

  console.log(`Score breakdown: Untappd=${p1.toFixed(1)}/35, BrewType=${p2}/5, BrewUntappd=${p3.toFixed(1)}/10, External=${p4.toFixed(1)}/30, Marijke=${p5.toFixed(1)}/20`);

  const total = p1 + p2 + p3 + p4 + p5;
  if (total < 70) return null;
  return Math.min(100, Math.round(total * 10) / 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Perplexity grounded searches — three parallel queries for maximum data
    let webSources = "";
    let allCitations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (perplexityKey) {
      try {
        const [ratingsResult, awardsResult, productionResult] = await Promise.all([
          searchPerplexity(
            perplexityKey,
            "You are a beer data researcher. Provide exact numerical ratings, review counts, and URLs. Be precise. IMPORTANT: Many Belgian breweries produce MULTIPLE VARIANTS with similar names (e.g. 'Aardbei' vs 'Aardbei/Kriek', different vintage years). Only provide ratings for the EXACT product requested, not for other variants.",
            `Find ALL ratings and reviews for the Belgian beer "${beerName}" by brewery "${breweryName}" (${beer.style}, ${beer.abv}% ABV).
Look on: Untappd, RateBeer, BeerAdvocate, Google Reviews, Vivino (if grape beer).
For each platform provide: exact score, number of reviews/check-ins, and direct URL to the beer page.
Also check if the brewery "${breweryName}" has an overall Untappd brewery rating.

CRITICAL — VARIANT AWARENESS:
- This brewery may have multiple products with similar names. Only report ratings for "${beerName}" specifically.
- If you find ratings for a different variant (e.g. "${beerName}/Kriek" or "${beerName} Oogst 2021"), clearly state which variant the rating belongs to.
- Do NOT average or merge ratings from different variants.`,
          ),
          searchPerplexity(
            perplexityKey,
            "You are a beer awards and pricing expert. Provide exact details with years, categories, and sources. IMPORTANT: Only report awards for the EXACT product requested, not for other variants with similar names.",
            `Has the Belgian beer "${beerName}" by "${breweryName}" won any awards, prizes, or medals? What competitions?
What is the retail price in Belgium or Europe? Check beer shops, brewery webshop, and retailers.
Also check if this beer or this brewery's beers have appeared in notable rankings or best-of lists.

CRITICAL — VARIANT AWARENESS:
- Only report awards for "${beerName}" specifically, not for other variants (e.g. if asked about "Aardbei", don't include awards for "Aardbei/Kriek").
- If unsure whether an award is for this exact product, say so explicitly.`,
          ),
          searchPerplexity(
            perplexityKey,
            "You are a beer production expert. Provide exact technical details about brewing, ingredients, and style classification. IMPORTANT: Many Belgian breweries produce multiple variants with similar names. Only provide production details for the EXACT product requested.",
            `Tell me everything about the production and ingredients of the Belgian beer "${beerName}" by "${breweryName}".
I need: exact ingredients (malt types, hops, fruits, grapes with varieties and percentages, spices, yeasts), 
fermentation method (spontaneous, top, bottom, mixed), aging details (barrels, duration, maceration time),
blending details (number of blends, age of components), bottle conditioning, 
and whether the current style label "${beer.style}" is accurate or should be more specific.
Also verify: is the ABV of ${beer.abv}% correct according to sources?

CRITICAL — VARIANT AWARENESS:
- "${breweryName}" may produce multiple variants like "${beerName}" (plain), "${beerName}/Kriek", "${beerName} Oogst [year]", "${beerName} BIO". These are DIFFERENT products with different ingredients, ABV, and production methods.
- Focus ONLY on "${beerName}". If you find data for a different variant, clearly label it as such.
- If ABV varies by vintage, list each vintage's ABV separately.`,
          ),
        ]);

        const parts: string[] = [];
        if (ratingsResult.content) parts.push(`RATINGS & REVIEWS:\n${ratingsResult.content}`);
        if (awardsResult.content) parts.push(`AWARDS & PRICING:\n${awardsResult.content}`);
        if (productionResult.content) parts.push(`PRODUCTION & VERIFICATION:\n${productionResult.content}`);
        webSources = parts.join("\n\n---\n\n");
        allCitations = [...new Set([...ratingsResult.citations, ...awardsResult.citations, ...productionResult.citations])];

        console.log(`Perplexity factcheck: ${webSources.length} chars, ${allCitations.length} citations for ${beerName}`);
      } catch (e) {
        console.error("Perplexity factcheck search failed:", e);
      }
    }

    // Fallback to Firecrawl
    if (!webSources) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (firecrawlKey) {
        try {
          const queries = [
            `"${beerName}" "${breweryName}" Untappd OR RateBeer OR BeerAdvocate rating`,
            `"${beerName}" "${breweryName}" award prize medal beer`,
            `"${beerName}" price EUR Belgium buy`,
          ];
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
          webSources = allResults
            .map((r: any) => `URL: ${r.url}\nTitle: ${r.title}\nSnippet: ${(r.description ?? "").slice(0, 400)}`)
            .join("\n---\n")
            .slice(0, 5000);
        } catch (e) {
          console.error("Firecrawl factcheck search failed:", e);
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const citationBlock = allCitations.length > 0
      ? `\nSource URLs found:\n${allCitations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`
      : "";

    const prompt = `Factcheck this Belgian beer STRICTLY based on the web sources provided below.

CRITICAL RULES:
- ONLY report data that is EXPLICITLY mentioned in the web sources below.
- If a rating, award, price, or fact is NOT found in the sources, use null or empty arrays.
- NEVER invent, estimate, or guess ratings, awards, or prices.
- If no web sources were found, return mostly null/empty values with confidence_score: 0.
- A score on Untappd is typically 0-5, RateBeer 0-100, BeerAdvocate 0-5.
- Only include a URL if it appears in the sources.
- IMPORTANT: If sources contain rich data, confidence_score should be high (70-100). Only use low scores when genuinely no data was found.

VARIANT AWARENESS (CRITICAL):
- This brewery may produce MULTIPLE products with similar names (e.g. "Aardbei" vs "Aardbei/Kriek", different Oogst/harvest years, BIO versions). These are DIFFERENT beers with different ABV, ingredients, and ratings.
- Only report data that applies to "${beerName}" specifically. Do NOT merge or average data from different variants.
- If a source mentions data for a different variant, do NOT include it unless you clearly flag it as "data is for [variant name], not for ${beerName}".
- If ABV values in sources differ by vintage/blend, note this in abv_sources and list each value with its vintage.
- Individual reviewer opinions should not be presented as verified facts.

Beer: "${beerName}"
Brewery: "${breweryName}"
Style: "${beer.style}"
ABV: ${beer.abv ?? 0}%

Web sources found:
${webSources || "NO WEB SOURCES FOUND — return null/empty for all fields."}
${citationBlock}

Return this exact JSON (use null when data is NOT in sources):
{
  "confidence_score": <0-100, based on how much verifiable data was found>,
  "variant_note": "<if sources reveal this is part of a family of variants, describe the relationship and which specific variant this data is about, otherwise null>",
  "abv_verified": <true ONLY if a source explicitly states this ABV for this exact product, otherwise false>,
  "abv_sources": [<ONLY URLs from sources that mention ABV>],
  "abv_range": "<if ABV varies by vintage/blend, state the range e.g. '5.8%-6.6%', otherwise null>",
  "style_verified": <true ONLY if a source confirms the style, otherwise false>,
  "style_note": "<if sources suggest a different/more specific style, note it here>",
  "awards": [<ONLY awards explicitly mentioned in sources with year — must be for THIS exact product>],
  "price_range": "<ONLY if a source mentions a price, otherwise null>",
  "external_ratings": {
    "untappd": {"score": <ONLY if found in sources for THIS product>, "url": <ONLY if found>, "review_count": <if found>},
    "ratebeer": {"score": <ONLY if found>, "url": <ONLY if found>},
    "beeradvocate": {"score": <ONLY if found>, "url": <ONLY if found>}
  },
  "external_links": [<ONLY URLs actually found in sources>],
  "production_verified": "<summary of production details confirmed by sources for THIS specific product, or null>",
  "ingredients_verified": "<summary of ingredients confirmed by sources for THIS specific product, or null>",
  "issues": [<data inconsistencies ONLY if sources contradict our data, including variant confusion>],
  "suggestions": [<improvements ONLY based on source evidence>]
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
          { role: "system", content: "You are a beer data verification expert. Return valid JSON only. When sources provide data, reflect that in confidence_score. CRITICAL: Many Belgian breweries produce multiple variants/blends with similar names — you must only verify data for the EXACT product requested and never conflate data from different variants." },
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
    let factcheck = JSON.parse(jsonStr);

    // Strip hallucinated details ONLY if confidence is very low AND no web data
    if ((factcheck.confidence_score ?? 0) <= 10 && webSources.length < 100) {
      console.log(`Stripping factcheck for ${beerName}: very low confidence AND no web sources`);
      factcheck = {
        confidence_score: factcheck.confidence_score ?? 0,
        abv_verified: false,
        abv_sources: [],
        style_verified: false,
        style_note: null,
        awards: [],
        price_range: null,
        external_ratings: {
          untappd: { score: null, url: null },
          ratebeer: { score: null, url: null },
          beeradvocate: { score: null, url: null },
        },
        external_links: [],
        production_verified: null,
        ingredients_verified: null,
        issues: [],
        suggestions: ["Geen betrouwbare bronnen gevonden — handmatige verificatie aanbevolen."],
      };
    }

    // Add citations to factcheck
    factcheck.citations = allCitations;

    // Compute composite score (5-pillar system)
    const compositeScore = computeCompositeScore(beer, brewery, factcheck);

    // Save — also include score breakdown for transparency
    const scoreBreakdown = {
      untappd_beer: calcUntappdBeerScore(factcheck),
      brewery_type: calcBreweryTypeScore(brewery),
      brewery_untappd: calcBreweryUntappdScore(brewery),
      external_reviews: calcExternalReviewScore(factcheck, brewery),
      marijke_taste: calcMarijkeScore(beer, factcheck),
    };
    factcheck.score_breakdown = scoreBreakdown;

    const { error: updateErr } = await supabase.from("beers").update({
      factcheck_json: factcheck,
      quality_score: compositeScore,
    }).eq("id", beer_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, factcheck, score_breakdown: scoreBreakdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("factcheck-beer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
