import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchPerplexity(apiKey: string, query: string): Promise<{ content: string; citations: string[] }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "You are a beer data researcher. Provide factual, verifiable data only. Include exact numbers, URLs, and dates when available." },
        { role: "user", content: query },
      ],
    }),
  });
  if (!res.ok) return { content: "", citations: [] };
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    citations: data.citations ?? [],
  };
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
  if (t.includes("micro") || t.includes("craft") || t.includes("blender") || t.includes("stekerij")) return 5;
  if (t.includes("family") || t.includes("trappist") || t.includes("abbey")) return 3;
  if (t.includes("regional") || t.includes("contract")) return 1;
  // Industrial / macro / unknown
  return 0;
}

// ── 3. Untappd Brewery Score (max 10 pts) ──
function calcBreweryUntappdScore(brewery: any): number {
  const r = brewery?.untappd_rating;
  if (typeof r === "number" && r > 0) return (r / 5) * 10;
  return 0;
}

// ── 4. Other Review Sites (max 30 pts) ──
function calcExternalReviewScore(factcheck: any, brewery: any): number {
  const scores: number[] = []; // normalised to 0-10

  const rb = factcheck.external_ratings?.ratebeer?.score;
  if (typeof rb === "number" && rb > 0) scores.push(rb / 10); // RateBeer is 0-100

  const ba = factcheck.external_ratings?.beeradvocate?.score;
  if (typeof ba === "number" && ba > 0) scores.push((ba / 5) * 10); // BA is 0-5

  // Google brewery rating as supplemental signal
  const goog = brewery?.google_rating;
  if (typeof goog === "number" && goog > 0) scores.push((goog / 5) * 10);

  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (avg / 10) * 30;
}

// ── 5. Marijke's Taste Profile (max 20 pts) ──
// 5a. Style preference (max 12 pts)
const MARIJKE_STYLE_PREFS: Record<string, number> = {
  // Factor 3 – favourites
  "imperial stout": 3, "pastry stout": 3, "stout": 3, "porter": 3,
  "barley wine": 3, "barleywine": 3,
  "ipa": 3, "west coast ipa": 3, "dipa": 3, "double ipa": 3, "triple ipa": 3,
  "black ipa": 3, "cold ipa": 3, "neipa": 3, "new england ipa": 3, "brut ipa": 3,
  "oude gueuze": 3, "oude geuze": 3, "gueuze": 3, "geuze": 3,
  "oude kriek": 3, "kriek": 3, "oud bruin": 3, "flanders red": 3, "flemish red": 3,
  "wild ale": 3, "gose": 3, "berliner weisse": 3, "lambic": 3, "lambiek": 3,
  "sour": 3, "fruited sour": 3,
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
  if (bestFactor < 0) bestFactor = 1; // unknown style → neutral
  return (bestFactor / 3) * 12;
}

// 5b. Flavour axes (max 8 pts, 2 per axis)
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
  if (/\b(sour|tart|acetic|lactic|funky|brett|lambic|gueuze|wild|oud bruin|vinous)\b/.test(all)) score += 2;
  else if (/\b(tangy|acidic|dry)\b/.test(all)) score += 1;

  // Axis 4: Experimenteel / barrel aged / gerookt / gekruid (0-2)
  if (/\b(barrel.?aged|bourbon|whisky|whiskey|smoked|rauch|experimental|vanilla|chili|pepper|cinnamon|spice)\b/.test(all)) score += 2;
  else if (/\b(oak|wood|herbal|spiced)\b/.test(all)) score += 1;

  return Math.min(8, score);
}

function calcMarijkeScore(beer: any, factcheck: any): number {
  return calcMarijkeStyleScore(beer.style ?? "") + calcMarijkeFlavorScore(beer, factcheck);
}

// ── Composite: sum of 5 pillars ──
function computeCompositeScore(
  beer: any,
  brewery: any,
  factcheck: any,
  _aiScore: number,
): number {
  const p1 = calcUntappdBeerScore(factcheck);        // max 35
  const p2 = calcBreweryTypeScore(brewery);           // max 5
  const p3 = calcBreweryUntappdScore(brewery);        // max 10
  const p4 = calcExternalReviewScore(factcheck, brewery); // max 30
  const p5 = calcMarijkeScore(beer, factcheck);       // max 20

  const total = p1 + p2 + p3 + p4 + p5;
  return Math.max(1, Math.min(100, Math.round(total * 10) / 10));
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

    // Perplexity grounded searches
    let webSources = "";
    let allCitations: string[] = [];
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (perplexityKey) {
      try {
        // Two focused searches in parallel
        const [ratingsResult, awardsResult] = await Promise.all([
          searchPerplexity(perplexityKey, `What are the ratings and reviews for "${beerName}" by "${breweryName}" on Untappd, RateBeer, and BeerAdvocate? Provide exact scores and URLs if available.`),
          searchPerplexity(perplexityKey, `Has the Belgian beer "${beerName}" by "${breweryName}" won any awards or prizes? What is the typical price in Belgium? Provide exact details with years and sources.`),
        ]);

        const parts: string[] = [];
        if (ratingsResult.content) parts.push(`RATINGS & REVIEWS:\n${ratingsResult.content}`);
        if (awardsResult.content) parts.push(`AWARDS & PRICING:\n${awardsResult.content}`);
        webSources = parts.join("\n\n---\n\n");
        allCitations = [...ratingsResult.citations, ...awardsResult.citations];
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

Beer: "${beerName}"
Brewery: "${breweryName}"
Style: "${beer.style}"
ABV: ${beer.abv ?? 0}%

Web sources found:
${webSources || "NO WEB SOURCES FOUND — return null/empty for all fields."}
${citationBlock}

Return this exact JSON (use null when data is NOT in sources):
{
  "confidence_score": <0-100, 0 if no sources found, higher only if sources confirm data>,
  "abv_verified": <true ONLY if a source explicitly states this ABV, otherwise false>,
  "abv_sources": [<ONLY URLs from sources that mention ABV, empty array if none>],
  "style_verified": <true ONLY if a source confirms the style, otherwise false>,
  "style_note": "<only if a source suggests a different style, otherwise null>",
  "awards": [<ONLY awards explicitly mentioned in sources with year, otherwise empty array>],
  "price_range": <ONLY if a source mentions a price, otherwise null>,
  "external_ratings": {
    "untappd": {"score": <ONLY if found in sources, otherwise null>, "url": <ONLY if found in sources, otherwise null>},
    "ratebeer": {"score": <ONLY if found in sources, otherwise null>, "url": <ONLY if found in sources, otherwise null>},
    "beeradvocate": {"score": <ONLY if found in sources, otherwise null>, "url": <ONLY if found in sources, otherwise null>}
  },
  "external_links": [<ONLY URLs actually found in sources>],
  "issues": [<data inconsistencies ONLY if sources contradict our data>],
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
          { role: "system", content: "You are a beer data verification expert. Return valid JSON only." },
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

    // Strip hallucinated details if confidence is very low
    if ((factcheck.confidence_score ?? 0) <= 10) {
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
        issues: [],
        suggestions: ["Geen betrouwbare bronnen gevonden — handmatige verificatie aanbevolen."],
      };
    }

    // Add citations to factcheck
    factcheck.citations = allCitations;

    // Compute composite score
    const aiScore = beer.quality_score ?? 50;
    const breweryUntappd = brewery?.untappd_rating;
    const breweryGoogle = brewery?.google_rating;
    let breweryRatingWeight: number;
    if (typeof breweryUntappd === "number" && breweryUntappd > 0 && typeof breweryGoogle === "number" && breweryGoogle > 0) {
      breweryRatingWeight = ((breweryUntappd + breweryGoogle) / 2) / 5;
    } else if (typeof breweryUntappd === "number" && breweryUntappd > 0) {
      breweryRatingWeight = breweryUntappd / 5;
    } else if (typeof breweryGoogle === "number" && breweryGoogle > 0) {
      breweryRatingWeight = breweryGoogle / 5;
    } else {
      breweryRatingWeight = 0.7;
    }

    const compositeScore = computeCompositeScore(beer, brewery, factcheck, aiScore);

    // Save
    await supabase.from("breweries").update({ rating_weight: breweryRatingWeight }).eq("id", brewery?.id);

    const { error: updateErr } = await supabase.from("beers").update({
      factcheck_json: factcheck,
      quality_score: compositeScore,
    }).eq("id", beer_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, factcheck }), {
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
