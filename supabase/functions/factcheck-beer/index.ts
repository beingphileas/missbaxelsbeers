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

    // Firecrawl search for factcheck sources
    let webSources = "";
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
            headers: {
              Authorization: `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Factcheck this Belgian beer based on web sources. Return JSON only.

Beer: "${beerName}"
Brewery: "${breweryName}"
Style: "${beer.style}"
ABV: ${beer.abv ?? 0}%
Our data - flavor profile: ${JSON.stringify(beer.flavor_profile ?? [])}
Our data - food pairing: ${beer.food_pairing ?? "none"}

Web sources found:
${webSources || "No web sources found."}

Return this exact JSON:
{
  "confidence_score": <0-100 how confident the factcheck is>,
  "abv_verified": <true/false>,
  "abv_sources": ["<URLs confirming ABV>"],
  "style_verified": <true/false>,
  "style_note": "<any correction or note about style>",
  "awards": [{"name": "<award name>", "year": <year>, "medal": "<gold/silver/bronze>"}],
  "price_range": {"min": <EUR>, "max": <EUR>, "currency": "EUR"},
  "external_ratings": {
    "untappd": {"score": <number or null>, "url": "<URL or null>"},
    "ratebeer": {"score": <number or null>, "url": "<URL or null>"},
    "beeradvocate": {"score": <number or null>, "url": "<URL or null>"}
  },
  "external_links": [{"label": "<site name>", "url": "<URL>"}],
  "issues": ["<any data inconsistencies found>"],
  "suggestions": ["<improvements to our data>"]
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
    const factcheck = JSON.parse(jsonStr);

    // Calculate composite quality_score from AI + external data
    const aiScore = beer.quality_score ?? 50;

    // Normalize external ratings to 0-100
    const externalScores: number[] = [];
    const untappd = factcheck.external_ratings?.untappd?.score;
    if (typeof untappd === "number" && untappd > 0) {
      externalScores.push((untappd / 5) * 100); // Untappd is 0-5
    }
    const ratebeer = factcheck.external_ratings?.ratebeer?.score;
    if (typeof ratebeer === "number" && ratebeer > 0) {
      externalScores.push(ratebeer); // RateBeer is already 0-100
    }
    const ba = factcheck.external_ratings?.beeradvocate?.score;
    if (typeof ba === "number" && ba > 0) {
      externalScores.push((ba / 5) * 100); // BA is 0-5
    }

    const avgExternal = externalScores.length > 0
      ? externalScores.reduce((a, b) => a + b, 0) / externalScores.length
      : null;

    // Awards bonus: up to +10 points
    const awardCount = Array.isArray(factcheck.awards) ? factcheck.awards.length : 0;
    const awardsBonus = Math.min(awardCount * 3, 10);

    // Brewery size bonus: Microbrewery +5, Family-owned +4, Blender/Stekerij +3, Contract +2, Trappist +1, Industrial 0
    const breweryType = (brewery?.type ?? "").toLowerCase();
    const sizeBonus =
      breweryType.includes("micro") ? 5 :
      breweryType.includes("family") ? 4 :
      breweryType.includes("blender") || breweryType.includes("stekerij") ? 3 :
      breweryType.includes("contract") ? 2 :
      breweryType.includes("trappist") ? 1 :
      0; // Industrial / Sub-site

    // Weighted composite: AI 50%, External 40%, Awards + Size bonus
    let compositeScore: number;
    if (avgExternal !== null) {
      compositeScore = Math.round(
        aiScore * 0.50 + avgExternal * 0.40 + awardsBonus + sizeBonus
      );
    } else {
      // No external data: AI 90% + bonuses
      compositeScore = Math.round(aiScore * 0.90 + awardsBonus + sizeBonus);
    }
    compositeScore = Math.max(1, Math.min(100, compositeScore));

    // Save factcheck + updated score to DB
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
