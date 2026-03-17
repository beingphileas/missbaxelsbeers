import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Scrape a single URL via Firecrawl
async function scrapeUrl(url: string, firecrawlKey: string, formats: string[] = ["markdown"]): Promise<{ markdown: string; screenshot: string }> {
  let formatted = url.trim();
  if (!formatted.startsWith("http")) formatted = "https://" + formatted;

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formatted,
        formats,
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) return { markdown: "", screenshot: "" };
    return {
      markdown: data.data?.markdown || data.markdown || "",
      screenshot: data.data?.screenshot || data.screenshot || "",
    };
  } catch (e) {
    console.error(`Scrape failed for ${formatted}:`, (e as Error).message);
    return { markdown: "", screenshot: "" };
  }
}

// Search the web via Firecrawl
async function searchWeb(
  query: string,
  firecrawlKey: string,
  limit = 8,
): Promise<{ url: string; markdown: string }[]> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) return [];
    return (data.data || []).map((r: any) => ({
      url: r.url || "",
      markdown: (r.markdown || "").substring(0, 8000),
    }));
  } catch (e) {
    console.error(`Search failed for "${query}":`, (e as Error).message);
    return [];
  }
}

// Extract beers from a screenshot via vision AI
async function extractBeersFromScreenshot(
  screenshotBase64: string,
  breweryName: string,
  sourceName: string,
  lovableKey: string,
): Promise<any[]> {
  if (!screenshotBase64) return [];

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a beer data extraction expert. Extract ALL beers visible in this screenshot that belong to "${breweryName}". Include every beer even if only a name is visible. Return JSON with a "beers" array, each with: name (required), style, abv (number), description.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract ALL beers for "${breweryName}" visible in this ${sourceName} screenshot.` },
              { type: "image_url", image_url: { url: screenshotBase64.startsWith("data:") ? screenshotBase64 : `data:image/png;base64,${screenshotBase64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_beers",
              description: "Return all beers found in the screenshot",
              parameters: {
                type: "object",
                properties: {
                  beers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        style: { type: "string" },
                        abv: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["name"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["beers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_beers" } },
      }),
    });

    if (!aiRes.ok) {
      console.error(`Vision AI error for ${sourceName}:`, aiRes.status);
      return [];
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return [];
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.beers || [];
  } catch (e) {
    console.error(`Vision extraction failed:`, (e as Error).message);
    return [];
  }
}

// Extract beers from markdown via AI
async function extractBeers(
  markdown: string,
  breweryName: string,
  sourceName: string,
  lovableKey: string,
): Promise<any[]> {
  if (!markdown || markdown.length < 30) return [];

  // Use up to 15000 chars for more complete extraction
  const truncated = markdown.substring(0, 15000);

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a beer data extraction expert specializing in Belgian beers.

Extract ALL beers/beer products from the given content that are brewed by or associated with "${breweryName}".

Rules:
- Extract EVERY beer mentioned, even if information is incomplete
- Include beers where only a name is visible (set other fields to empty)
- A beer "belongs" to this brewery if it appears on their page, is listed under their name, or the page is about this brewery
- For contract brewers: include beers they commission even if brewed elsewhere
- Do NOT skip beers just because they lack ABV or style info
- Do NOT include beers clearly from a different/unrelated brewery
- Do NOT include events, merchandise, food items, or non-beer products
- Extract style as specifically as possible (Tripel, Blond, IPA, Dubbel, Witbier, Stout, Saison, Lambic, Kriek, Quadrupel, etc.)
- ABV should be a number (e.g. 6.5), not a string`,
        },
        {
          role: "user",
          content: `Extract ALL beers for "${breweryName}" from this ${sourceName} content:\n\n${truncated}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_beers",
            description: "Return all beers found for this brewery",
            parameters: {
              type: "object",
              properties: {
                beers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Beer name (without brewery prefix if redundant)" },
                      style: { type: "string", description: "Beer style" },
                      abv: { type: "number", description: "Alcohol percentage as number" },
                      description: { type: "string", description: "Short description" },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["beers"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_beers" } },
    }),
  });

  if (!aiRes.ok) {
    console.error(`AI error for ${sourceName}:`, aiRes.status);
    return [];
  }

  const aiData = await aiRes.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.beers || [];
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
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
  const {
    data: { user },
    error: authErr,
  } = await anonClient.auth.getUser();
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

  const { data: roleCheck } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { brewery_id } = await req.json();
    if (!brewery_id) {
      return new Response(JSON.stringify({ error: "brewery_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: brewery, error: bErr } = await supabase
      .from("breweries")
      .select("id, name, website_url")
      .eq("id", brewery_id)
      .single();

    if (bErr || !brewery) {
      return new Response(JSON.stringify({ error: "Brewery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Multi-source scrape for: ${brewery.name}`);

    // Blocklist: domains that produce too much noise / false positives
    const BLOCKED_DOMAINS = [
      "bloggen.be", "www.bloggen.be",
      "facebook.com", "www.facebook.com",
      "instagram.com", "www.instagram.com",
      "twitter.com", "x.com",
      "youtube.com", "www.youtube.com",
      "pinterest.com",
    ];
    const isBlocked = (url: string) => {
      try {
        const hostname = new URL(url).hostname;
        return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
      } catch { return false; }
    };

    const sources: { name: string; url: string; markdown: string }[] = [];
    const screenshots: { name: string; url: string; screenshot: string }[] = [];

    // === SOURCE 1: Brewery's own website (markdown + screenshot) ===
    const websitePromise = brewery.website_url?.trim()
      ? scrapeUrl(brewery.website_url, firecrawlKey, ["markdown", "screenshot"]).then((result) => {
          let url = brewery.website_url!.trim();
          if (!url.startsWith("http")) url = "https://" + url;
          if (result.markdown && result.markdown.length > 50) {
            sources.push({ name: "Eigen website", url, markdown: result.markdown });
          }
          if (result.screenshot) {
            screenshots.push({ name: "Eigen website (screenshot)", url, screenshot: result.screenshot });
          }
        })
      : Promise.resolve();

    // === SOURCE 2: Direct belgenbier.be scrape (markdown + screenshot) ===
    const encodedName = encodeURIComponent(brewery.name);
    const belgenbierPromise = scrapeUrl(
      `https://www.belgenbier.be/nl/zoeken?search=${encodedName}`,
      firecrawlKey,
      ["markdown", "screenshot"],
    ).then((result) => {
      const url = `https://www.belgenbier.be/nl/zoeken?search=${encodedName}`;
      if (result.markdown && result.markdown.length > 100) {
        sources.push({ name: "belgenbier.be", url, markdown: result.markdown });
      }
      if (result.screenshot) {
        screenshots.push({ name: "belgenbier.be (screenshot)", url, screenshot: result.screenshot });
      }
    });

    // === SOURCE 3: Direct untappd search + screenshot scrape of top result ===
    const untappdPromise = searchWeb(
      `site:untappd.com "${brewery.name}" beer`,
      firecrawlKey,
      5,
    ).then(async (results) => {
      for (const r of results) {
        if (r.markdown && r.markdown.length > 50) {
          sources.push({ name: "untappd.com", url: r.url, markdown: r.markdown });
        }
      }
      // Screenshot-scrape the top Untappd result for visual beer lists
      if (results.length > 0 && results[0].url) {
        const ssResult = await scrapeUrl(results[0].url, firecrawlKey, ["screenshot"]);
        if (ssResult.screenshot) {
          screenshots.push({ name: "untappd.com (screenshot)", url: results[0].url, screenshot: ssResult.screenshot });
        }
      }
    });

    // === SOURCE 4: BeerAdvocate + RateBeer search + screenshot ===
    const beerDbPromise = searchWeb(
      `"${brewery.name}" beers site:beeradvocate.com OR site:ratebeer.com`,
      firecrawlKey,
      5,
    ).then(async (results) => {
      for (const r of results) {
        if (r.markdown && r.markdown.length > 50 && !sources.find((s) => s.url === r.url) && !isBlocked(r.url)) {
          sources.push({ name: new URL(r.url).hostname, url: r.url, markdown: r.markdown });
        }
      }
      // Screenshot the top result
      if (results.length > 0 && results[0].url) {
        const ssResult = await scrapeUrl(results[0].url, firecrawlKey, ["screenshot"]);
        if (ssResult.screenshot) {
          screenshots.push({ name: `${new URL(results[0].url).hostname} (screenshot)`, url: results[0].url, screenshot: ssResult.screenshot });
        }
      }
    });

    // === SOURCE 5: General web search + screenshot ===
    const generalPromise = searchWeb(
      `"${brewery.name}" bieren lijst complete beer list`,
      firecrawlKey,
      5,
    ).then(async (results) => {
      for (const r of results) {
        if (r.markdown && r.markdown.length > 50 && !sources.find((s) => s.url === r.url) && !isBlocked(r.url)) {
          sources.push({ name: new URL(r.url).hostname, url: r.url, markdown: r.markdown });
        }
      }
      // Screenshot the top result if not already captured
      if (results.length > 0 && results[0].url && !screenshots.find(s => s.url === results[0].url)) {
        const ssResult = await scrapeUrl(results[0].url, firecrawlKey, ["screenshot"]);
        if (ssResult.screenshot) {
          screenshots.push({ name: `${new URL(results[0].url).hostname} (screenshot)`, url: results[0].url, screenshot: ssResult.screenshot });
        }
      }
    });

    await Promise.allSettled([
      websitePromise,
      belgenbierPromise,
      untappdPromise,
      beerDbPromise,
      generalPromise,
    ]);

    console.log(
      `Found ${sources.length} text sources + ${screenshots.length} screenshots for ${brewery.name}`,
    );

    if (sources.length === 0 && screenshots.length === 0) {
      return new Response(
        JSON.stringify({
          brewery_name: brewery.name,
          beers: [],
          sources: [],
          error: "Geen bronnen gevonden om te scrapen",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract beers from each source in parallel
    const allBeers: {
      name: string;
      style: string;
      abv: number | null;
      description: string;
      source: string;
      source_url: string;
    }[] = [];

    const extractionPromises = sources.map((source) =>
      extractBeers(source.markdown, brewery.name, source.name, lovableKey).then((beers) => {
        console.log(`  ${source.name}: extracted ${beers.length} beers`);
        for (const b of beers) {
          allBeers.push({
            name: b.name || "",
            style: b.style || "",
            abv: b.abv || null,
            description: b.description || "",
            source: source.name,
            source_url: source.url,
          });
        }
      }),
    );

    // Extract beers from screenshots via vision AI
    const screenshotPromises = screenshots.map((ss) =>
      extractBeersFromScreenshot(ss.screenshot, brewery.name, ss.name, lovableKey).then((beers) => {
        console.log(`  ${ss.name}: extracted ${beers.length} beers from screenshot`);
        for (const b of beers) {
          allBeers.push({
            name: b.name || "",
            style: b.style || "",
            abv: b.abv || null,
            description: b.description || "",
            source: ss.name,
            source_url: ss.url,
          });
        }
      }),
    );

    await Promise.allSettled([...extractionPromises, ...screenshotPromises]);

    // Deduplicate beers by name (case-insensitive), keep the one with most data
    const deduped = new Map<string, (typeof allBeers)[0]>();
    for (const beer of allBeers) {
      // Normalize: lowercase, trim, remove brewery name prefix
      let key = beer.name.toLowerCase().trim();
      // Remove common brewery name prefixes for dedup
      const brewLower = brewery.name.toLowerCase();
      if (key.startsWith(brewLower + " ")) {
        key = key.slice(brewLower.length + 1);
      }
      // Also remove leading "brouwerij X " patterns
      key = key.replace(/^brouwerij\s+\S+\s+/i, "");

      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, beer);
      } else {
        const score = (b: typeof beer) =>
          (b.style ? 1 : 0) + (b.abv ? 2 : 0) + (b.description ? 1 : 0);
        if (score(beer) > score(existing)) {
          deduped.set(key, beer);
        }
      }
    }

    const enriched = Array.from(deduped.values()).map((b) => ({
      name: b.name,
      style: b.style,
      abv: b.abv,
      description: b.description,
      brewery: brewery.name,
      brewery_id: brewery.id,
      source: b.source,
      source_url: b.source_url,
    }));

    console.log(
      `Result: ${allBeers.length} raw → ${enriched.length} unique beers from ${sources.length} sources`,
    );

    // === AI VALIDATION: filter out false positives ===
    let validated = enriched;
    let rejected: { name: string; reason: string }[] = [];

    if (enriched.length > 0) {
      try {
        const beerList = enriched.map((b, i) => `${i + 1}. "${b.name}" (style: ${b.style || "?"}, abv: ${b.abv || "?"}, source: ${b.source})`).join("\n");

        const valRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a Belgian beer expert and fact-checker. Your job is to validate a list of beers scraped for brewery "${brewery.name}".

For each beer, determine if it is VALID or INVALID:

VALID means:
- It is a real beer (not a food item, event, merchandise, glass, gift box, mixed pack name, or category header)
- It is actually brewed by, for, or closely associated with "${brewery.name}"
- The name makes sense as a beer name

INVALID means:
- It is NOT a real beer product (e.g. "Proefpakket", "Cadeaubon", "Bierglas", "Verkoop", a category name, etc.)
- It clearly belongs to a DIFFERENT brewery (e.g. a competitor's beer that appeared on the same page)
- It is a duplicate phrasing of another beer on the list (e.g. "Beer X 33cl" vs "Beer X" — keep the shorter canonical name)
- The name is gibberish, a URL fragment, or scraped noise

Be strict but fair. When in doubt about association, mark as VALID. Belgian breweries sometimes contract-brew for others.`,
              },
              {
                role: "user",
                content: `Validate these ${enriched.length} beers for "${brewery.name}":\n\n${beerList}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "validate_beers",
                  description: "Return validation results for each beer",
                  parameters: {
                    type: "object",
                    properties: {
                      results: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            index: { type: "number", description: "1-based index from the list" },
                            valid: { type: "boolean" },
                            reason: { type: "string", description: "Short reason if invalid" },
                          },
                          required: ["index", "valid"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["results"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "validate_beers" } },
          }),
        });

        if (valRes.ok) {
          const valData = await valRes.json();
          const toolCall = valData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            const results = parsed.results || [];

            const invalidIndices = new Set<number>();
            for (const r of results) {
              if (!r.valid && r.index >= 1 && r.index <= enriched.length) {
                invalidIndices.add(r.index - 1);
                rejected.push({ name: enriched[r.index - 1].name, reason: r.reason || "Ongeldig" });
              }
            }

            validated = enriched.filter((_, i) => !invalidIndices.has(i));
            console.log(`AI validation: ${enriched.length} → ${validated.length} valid, ${rejected.length} rejected`);
          }
        } else {
          console.error("AI validation failed:", valRes.status, "— skipping validation");
        }
      } catch (valErr) {
        console.error("AI validation error:", (valErr as Error).message, "— skipping validation");
      }
    }

    return new Response(
      JSON.stringify({
        brewery_name: brewery.name,
        sources: sources.map((s) => ({ name: s.name, url: s.url })),
        beers: validated,
        rejected,
        ai_checked: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Scrape error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
