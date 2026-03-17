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

  const screenshotInput = screenshotBase64.trim();
  const screenshotUrl = screenshotInput.startsWith("http://") || screenshotInput.startsWith("https://")
    ? screenshotInput
    : screenshotInput.startsWith("data:")
      ? screenshotInput
      : `data:image/png;base64,${screenshotInput}`;

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
              { type: "image_url", image_url: { url: screenshotUrl } },
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

  // Use a larger context for brewery website pages to capture full product listings/details
  const maxChars = sourceName.startsWith("Eigen website") ? 60000 : 20000;
  const truncated = markdown.substring(0, maxChars);

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
    const { brewery_id, mode = "single" } = await req.json();
    if (!brewery_id) {
      return new Response(JSON.stringify({ error: "brewery_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isBulk = mode === "bulk";
    const websiteMapLimit = isBulk ? 60 : 300;
    const websiteListingLimit = isBulk ? 2 : 8;
    const websiteDetailLimit = isBulk ? 6 : 20;
    const websitePaginationLimit = isBulk ? 2 : 10;
    const untappdMapLimit = isBulk ? 150 : 500;
    const untappdPaginationMaxStart = isBulk ? 50 : 200;
    const untappdDetailPageLimit = isBulk ? 12 : 60;
    const screenshotExtractionLimit = isBulk ? 2 : 20;
    const sourceExtractionLimit = isBulk ? 14 : 120;

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

    const markScrapeTimestamp = async () => {
      const { error } = await supabase
        .from("breweries")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", brewery.id);

      if (error) {
        console.error(`Failed to store last_scraped_at for ${brewery.name}:`, error.message);
      }
    };

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

    // === SOURCE 1: Brewery's own website — homepage + discover beer/shop subpages + pagination ===
    const websitePromise = (async () => {
      if (!brewery.website_url?.trim()) return;

      let baseUrl = brewery.website_url.trim();
      if (!baseUrl.startsWith("http")) baseUrl = "https://" + baseUrl;

      // Scrape homepage
      const homeResult = await scrapeUrl(baseUrl, firecrawlKey, ["markdown", "screenshot"]);
      if (homeResult.markdown && homeResult.markdown.length > 50) {
        sources.push({ name: "Eigen website", url: baseUrl, markdown: homeResult.markdown });
      }
      if (homeResult.screenshot) {
        screenshots.push({ name: "Eigen website (screenshot)", url: baseUrl, screenshot: homeResult.screenshot });
      }

      // Use Firecrawl Map to discover all subpages
      let subpageUrls: string[] = [];
      try {
        const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: baseUrl, limit: websiteMapLimit, includeSubdomains: false }),
        });
        const mapData = await mapRes.json();
        if (mapRes.ok && mapData.success && mapData.links) {
          subpageUrls = mapData.links as string[];
          console.log(`  Website map: found ${subpageUrls.length} URLs`);
        }
      } catch (e) {
        console.error(`  Website map failed:`, (e as Error).message);
      }

      const normalizePageUrl = (u: string) => {
        try {
          const parsed = new URL(u.startsWith("http") ? u : new URL(u, baseUrl).href);
          parsed.hash = "";
          return parsed.href.replace(/\/$/, "");
        } catch {
          return u;
        }
      };

      // Find beer-related subpages by URL pattern and prioritize listing pages first
      const beerPatterns = /\/(shop|bieren|beers|assortiment|products|producten|onze-bieren|gamme|nos-bieres|our-beers|webshop|aanbod)/i;
      const candidatePages = subpageUrls
        .map(normalizePageUrl)
        .filter((u) => beerPatterns.test(u) && u !== normalizePageUrl(baseUrl))
        .filter((u) => !/\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(u));

      const listingPages = candidatePages.filter((u) => {
        const path = (() => {
          try {
            return new URL(u).pathname;
          } catch {
            return "";
          }
        })();
        return /(\/shop|\/bieren|\/beers|\/assortiment|\/products|\/onze-bieren|\/webshop|\/aanbod)$/i.test(path);
      });

      const detailPages = candidatePages.filter((u) => !listingPages.includes(u));

      const prioritizedBeerPages = [...new Set([...listingPages.slice(0, websiteListingLimit), ...detailPages.slice(0, websiteDetailLimit)])];

      // If no beer pages found via map, try common paths directly
      if (prioritizedBeerPages.length === 0) {
        const commonPaths = ["/shop", "/bieren", "/beers", "/assortiment", "/onze-bieren", "/products", "/SHOP"];
        for (const path of commonPaths) {
          prioritizedBeerPages.push(normalizePageUrl(new URL(path, baseUrl).href));
        }
      }

      const uniqueBeerPages = [...new Set(prioritizedBeerPages)];
      console.log(`  Website beer pages to scrape (${uniqueBeerPages.length}): ${uniqueBeerPages.join(", ")}`);

      // Scrape beer subpages in parallel — with screenshots for visual extraction
      const subResults = await Promise.allSettled(
        uniqueBeerPages.map(async (pageUrl) => {
          // Request both markdown AND screenshot so we can extract from images too
          const result = await scrapeUrl(pageUrl, firecrawlKey, ["markdown", "screenshot"]);
          if (result.markdown && result.markdown.length > 50) {
            sources.push({ name: "Eigen website (subpagina)", url: pageUrl, markdown: result.markdown });

            // Check for pagination: look for ?page=2, ?spage=2, etc.
            const paginationMatches = result.markdown.match(/(?:spage|page)=(\d+)/g);
            if (paginationMatches) {
              const maxPage = Math.max(...paginationMatches.map(m => parseInt(m.split("=")[1])));
              if (maxPage > 1) {
                const pagesToScrape = Math.min(maxPage, websitePaginationLimit);
                const pagePromises = [];
                for (let p = 2; p <= pagesToScrape; p++) {
                  const separator = pageUrl.includes("?") ? "&" : "?";
                  const pageParam = result.markdown.includes("spage=") ? "spage" : "page";
                  const pagedUrl = `${pageUrl}${separator}${pageParam}=${p}`;
                  pagePromises.push(
                    scrapeUrl(pagedUrl, firecrawlKey, ["markdown", "screenshot"]).then((pr) => {
                      if (pr.markdown && pr.markdown.length > 50) {
                        sources.push({ name: `Eigen website (pagina ${p})`, url: pagedUrl, markdown: pr.markdown });
                      }
                      if (pr.screenshot) {
                        screenshots.push({ name: `Eigen website (pagina ${p} screenshot)`, url: pagedUrl, screenshot: pr.screenshot });
                      }
                    })
                  );
                }
                await Promise.allSettled(pagePromises);
                console.log(`  Scraped ${pagesToScrape - 1} extra pagination pages from ${pageUrl}`);
              }
            }
          }
          // Always capture screenshots of beer/shop pages for visual extraction
          if (result.screenshot) {
            screenshots.push({ name: "Eigen website (subpagina screenshot)", url: pageUrl, screenshot: result.screenshot });
          }
        })
      );
    })();

    // === SOURCE 2: Perplexity AI Search — grounded web search for beers ===
    const perplexityPromise = (async () => {
      const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
      if (!perplexityKey) {
        console.log("  Perplexity: not configured, skipping");
        return;
      }

      try {
        const query = `List ALL beers brewed by Belgian brewery "${brewery.name}". Include beer name, style (e.g. Tripel, Blond, IPA, Dubbel, Stout, Saison, Lambic, Kriek), and ABV percentage for each beer. Only include beers actually brewed by or for this brewery.`;

        const res = await fetch("https://api.perplexity.ai/chat/completions", {
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
                content: `You are a Belgian beer expert. Return a comprehensive list of all beers for the requested brewery. Format each beer on its own line as: "- BeerName | Style: xxx | ABV: x.x%". Only include real beers, no merchandise or events.`,
              },
              { role: "user", content: query },
            ],
          }),
        });

        if (!res.ok) {
          console.error(`  Perplexity: HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        const citations = data.citations || [];

        if (content && content.length > 30) {
          const citationLines = citations.length > 0
            ? `\n\nSources: ${citations.join(", ")}`
            : "";
          sources.push({
            name: "Perplexity (web search)",
            url: citations[0] || `https://perplexity.ai/search?q=${encodeURIComponent(brewery.name + " beers")}`,
            markdown: `# Perplexity search results for "${brewery.name}"\n\n${content}${citationLines}`,
          });
          console.log(`  Perplexity: got ${content.length} chars of beer data`);
        } else {
          console.log(`  Perplexity: no useful results for "${brewery.name}"`);
        }
      } catch (e) {
        console.error(`  Perplexity error:`, (e as Error).message);
      }
    })();

    await Promise.allSettled([websitePromise, perplexityPromise]);

    console.log(
      `Found ${sources.length} text sources + ${screenshots.length} screenshots for ${brewery.name}`,
    );

    if (sources.length === 0 && screenshots.length === 0) {
      await markScrapeTimestamp();
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

    const sortedSources = [...sources].sort((a, b) => {
      const rank = (name: string) => {
        if (name.startsWith("Eigen website")) return 0;
        if (name.startsWith("Perplexity")) return 1;
        return 2;
      };
      return rank(a.name) - rank(b.name);
    });

    const sortedScreenshots = [...screenshots].sort((a, b) => {
      const rank = (name: string) => {
        if (name.startsWith("Eigen website")) return 0;
        return 1;
      };
      return rank(a.name) - rank(b.name);
    });

    const sourcesToExtract = sortedSources.slice(0, sourceExtractionLimit);
    const screenshotsToExtract = sortedScreenshots.slice(0, screenshotExtractionLimit);

    const extractionPromises = sourcesToExtract.map((source) =>
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
    const screenshotPromises = screenshotsToExtract.map((ss) =>
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

    // Deduplicate beers by name (case-insensitive), and merge fields across sources
    const deduped = new Map<string, (typeof allBeers)[0]>();
    for (const beer of allBeers) {
      // Normalize: lowercase, trim, remove brewery name prefix
      let key = beer.name.toLowerCase().trim();
      const brewLower = brewery.name.toLowerCase();
      if (key.startsWith(brewLower + " ")) {
        key = key.slice(brewLower.length + 1);
      }
      key = key.replace(/^brouwerij\s+\S+\s+/i, "");

      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, beer);
        continue;
      }

      const preferNewStyle = !existing.style && !!beer.style;
      const preferNewAbv = (existing.abv == null) && (beer.abv != null);
      const preferNewDescription = (!existing.description && !!beer.description) || (beer.description?.length || 0) > (existing.description?.length || 0);

      // If website has richer content, prioritize it for textual fields
      const incomingFromWebsite = beer.source.startsWith("Eigen website");
      const existingFromWebsite = existing.source.startsWith("Eigen website");

      deduped.set(key, {
        ...existing,
        style: preferNewStyle || (incomingFromWebsite && !existingFromWebsite && !!beer.style) ? beer.style : existing.style,
        abv: preferNewAbv ? beer.abv : existing.abv,
        description: preferNewDescription || (incomingFromWebsite && !existingFromWebsite && !!beer.description)
          ? beer.description
          : existing.description,
        source: incomingFromWebsite && !existingFromWebsite ? beer.source : existing.source,
        source_url: incomingFromWebsite && !existingFromWebsite ? beer.source_url : existing.source_url,
      });
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

    await markScrapeTimestamp();

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
