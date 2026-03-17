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
    const websiteMapLimit = isBulk ? 120 : 300;
    const websiteListingLimit = isBulk ? 4 : 8;
    const websiteDetailLimit = isBulk ? 10 : 20;
    const websitePaginationLimit = isBulk ? 4 : 10;
    const untappdMapLimit = isBulk ? 250 : 500;
    const untappdPaginationMaxStart = isBulk ? 100 : 200;
    const untappdDetailPageLimit = isBulk ? 30 : 60;
    const screenshotExtractionLimit = isBulk ? 6 : 20;
    const sourceExtractionLimit = isBulk ? 36 : 120;

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
                const pagesToScrape = Math.min(maxPage, 10);
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

    // === SOURCE 2: Untappd — find brewery page, map all beer URLs, scrape everything ===
    const untappdPromise = (async () => {
      // Wait for website scraping to finish so we can extract Untappd links from it
      await websitePromise;

      // Step 0: Check if we found an Untappd link on the brewery's own website
      let untappdLinkFromWebsite = "";
      for (const src of sources) {
        if (src.name.startsWith("Eigen website")) {
          // Look for untappd.com links in the markdown
          const untappdMatch = src.markdown.match(/https?:\/\/untappd\.com\/[^\s)"\]]+/i);
          if (untappdMatch) {
            untappdLinkFromWebsite = untappdMatch[0];
            console.log(`  Found Untappd link on website: ${untappdLinkFromWebsite}`);
            break;
          }
        }
      }

      // Generate multiple name variants for better search coverage
      const nameVariants = new Set<string>();
      nameVariants.add(brewery.name);

      // Remove common prefixes
      const withoutPrefix = brewery.name.replace(/^(brouwerij|brasserie|brewery|de|het|'t)\s+/i, "").trim();
      if (withoutPrefix !== brewery.name) nameVariants.add(withoutPrefix);

      // Split camelCase/PascalCase (e.g. "StraeteBrouwerie" → "Straete Brouwerie")
      const splitCamel = brewery.name.replace(/([a-z])([A-Z])/g, "$1 $2");
      if (splitCamel !== brewery.name) {
        nameVariants.add(splitCamel);
        const camelWithoutSuffix = splitCamel.replace(/\s*(brouweri[ej]|brewery|brasserie)$/i, "").trim();
        if (camelWithoutSuffix !== splitCamel) nameVariants.add(camelWithoutSuffix);
      }

      // Remove trailing Brouwerij/Brewery/Brasserie
      const withoutSuffix = brewery.name.replace(/\s*(brouweri[ej]|brewery|brasserie)$/i, "").trim();
      if (withoutSuffix !== brewery.name) nameVariants.add(withoutSuffix);

      console.log(`  Untappd: searching with variants: ${[...nameVariants].join(", ")}`);

      // Search with all variants in parallel
      const searchPromises = [...nameVariants].flatMap(name => [
        searchWeb(`site:untappd.com/w/ "${name}"`, firecrawlKey, 5),
        searchWeb(`site:untappd.com "${name}" brewery beer`, firecrawlKey, 3),
      ]);

      const searchResultSets = await Promise.all(searchPromises);
      const allSearchResults = searchResultSets.flat();

      // Find the main brewery page URL
      // Accept multiple patterns: /w/name/ID, /Brewery_Name, /w/name
      let breweryPageUrl = untappdLinkFromWebsite; // Prefer the link from their own website
      const seen = new Set<string>();

      for (const r of allSearchResults) {
        if (seen.has(r.url)) continue;
        seen.add(r.url);

        // Check for brewery page patterns
        if (!breweryPageUrl && r.url) {
          if (/untappd\.com\/(w\/[^/]+\/\d+|w\/[^/]+$)/.test(r.url) ||
              /untappd\.com\/[A-Z][A-Za-z_]+$/.test(r.url)) {
            breweryPageUrl = r.url;
          }
        }

        if (r.url?.includes("untappd.com") && r.markdown && r.markdown.length > 50) {
          sources.push({ name: "untappd.com", url: r.url, markdown: r.markdown });
        }
      }

      if (!breweryPageUrl) {
        console.log(`  Untappd: no brewery page found, used ${allSearchResults.length} search results`);
        return;
      }

      console.log(`  Untappd brewery page: ${breweryPageUrl}`);

      // Normalize brewery page URL — strip trailing slash
      const cleanBreweryUrl = breweryPageUrl.replace(/\/+$/, "");

      // Step 2: Scrape the brewery page AND the /beer sub-page (full beer list) in parallel
      const beerListUrl = cleanBreweryUrl + "/beer";
      const breweryPageScrape = scrapeUrl(cleanBreweryUrl, firecrawlKey, ["markdown", "screenshot"]);
      const beerListScrape = scrapeUrl(beerListUrl, firecrawlKey, ["markdown", "screenshot"]);

      // Step 3: Use Firecrawl Map to discover all beer URLs on the brewery page
      let beerUrls: string[] = [];
      try {
        const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: cleanBreweryUrl,
            search: "beer",
            limit: 500,
            includeSubdomains: true,
          }),
        });
        const mapData = await mapRes.json();
        if (mapRes.ok && mapData.success && mapData.links) {
          beerUrls = (mapData.links as string[]).filter(
            (u: string) => /untappd\.com\/b\/[^/]+\/\d+/.test(u)
          );
          console.log(`  Untappd map: found ${beerUrls.length} beer URLs`);
        }
      } catch (e) {
        console.error(`  Untappd map failed:`, (e as Error).message);
      }

      // Wait for brewery page + beer list page scrapes
      const [bpResult, blResult] = await Promise.all([breweryPageScrape, beerListScrape]);

      if (bpResult.markdown && bpResult.markdown.length > 50) {
        const existing = sources.findIndex(s => s.url === cleanBreweryUrl);
        if (existing >= 0) {
          sources[existing].markdown = bpResult.markdown;
        } else {
          sources.push({ name: "untappd.com (brouwerijpagina)", url: cleanBreweryUrl, markdown: bpResult.markdown });
        }
        // Extract beer URLs from markdown links: /b/beer-name/12345
        const mdBeerLinks = bpResult.markdown.match(/untappd\.com\/b\/[^\s)"\]\>]+/g) || [];
        for (const link of mdBeerLinks) {
          const full = link.startsWith("http") ? link : "https://" + link;
          if (/\/b\/[^/]+\/\d+/.test(full) && !beerUrls.includes(full)) beerUrls.push(full);
        }
      }
      if (bpResult.screenshot) {
        screenshots.push({ name: "untappd.com (brouwerijpagina screenshot)", url: cleanBreweryUrl, screenshot: bpResult.screenshot });
      }

      // Process beer list page (/beer)
      if (blResult.markdown && blResult.markdown.length > 50) {
        sources.push({ name: "untappd.com (bierlijst)", url: beerListUrl, markdown: blResult.markdown });
        // Extract beer URLs from beer list markdown
        const mdBeerLinks2 = blResult.markdown.match(/untappd\.com\/b\/[^\s)"\]\>]+/g) || [];
        for (const link of mdBeerLinks2) {
          const full = link.startsWith("http") ? link : "https://" + link;
          if (/\/b\/[^/]+\/\d+/.test(full) && !beerUrls.includes(full)) beerUrls.push(full);
        }
        console.log(`  Untappd beer list page: extracted ${mdBeerLinks2.length} beer links, total unique: ${beerUrls.length}`);
      }
      if (blResult.screenshot) {
        screenshots.push({ name: "untappd.com (bierlijst screenshot)", url: beerListUrl, screenshot: blResult.screenshot });
      }

      // Step 3b: If still few beer URLs, try paginated beer list: /beer?sort=date&start=0,25,50...
      if (beerUrls.length < 30) {
        const paginatedPromises = [];
        for (let start = 25; start <= 200; start += 25) {
          const pageUrl = `${beerListUrl}?sort=date&start=${start}`;
          paginatedPromises.push(
            scrapeUrl(pageUrl, firecrawlKey, ["markdown"]).then((pr) => {
              if (pr.markdown && pr.markdown.length > 50) {
                sources.push({ name: `untappd.com (bierlijst p${Math.floor(start/25)+1})`, url: pageUrl, markdown: pr.markdown });
                const links = pr.markdown.match(/untappd\.com\/b\/[^\s)"\]\>]+/g) || [];
                for (const link of links) {
                  const full = link.startsWith("http") ? link : "https://" + link;
                  if (/\/b\/[^/]+\/\d+/.test(full) && !beerUrls.includes(full)) beerUrls.push(full);
                }
              }
            })
          );
        }
        await Promise.allSettled(paginatedPromises);
        console.log(`  Untappd after pagination: ${beerUrls.length} total beer URLs`);
      }

      // Step 4: Scrape individual beer pages (up to 60 for completeness)
      const toScrape = beerUrls.slice(0, 60);
      if (toScrape.length > 0) {
        // Batch in groups of 10 to avoid overwhelming
        for (let i = 0; i < toScrape.length; i += 10) {
          const batch = toScrape.slice(i, i + 10);
          await Promise.allSettled(
            batch.map(async (beerUrl) => {
              const result = await scrapeUrl(beerUrl, firecrawlKey);
              if (result.markdown && result.markdown.length > 30) {
                sources.push({ name: "untappd.com (bier)", url: beerUrl, markdown: result.markdown });
              }
            })
          );
        }
        console.log(`  Untappd: scraped ${toScrape.length} individual beer pages`);
      }
    })();

    // === SOURCE 3: OpenFoodFacts — free API, no key needed ===
    const openFoodPromise = (async () => {
      try {
        // Search by brand name in beer category
        const searchName = encodeURIComponent(brewery.name);
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchName}&tagtype_0=categories&tag_contains_0=contains&tag_0=beers&search_simple=1&action=process&json=1&page_size=100&fields=product_name,brands,categories,alcohol_value,generic_name,quantity,image_url,url`;

        const res = await fetch(url, {
          headers: { "User-Agent": "BelgiumBeerWhisperer/1.0 (contact: admin@belgiumwhisperer.be)" },
        });

        if (!res.ok) {
          console.error(`  OpenFoodFacts: HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        const products = data.products || [];

        if (products.length === 0) {
          // Try simplified name
          const simpleName = brewery.name.replace(/^(brouwerij|brasserie|brewery)\s+/i, "").trim();
          if (simpleName !== brewery.name) {
            const url2 = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(simpleName)}&tagtype_0=categories&tag_contains_0=contains&tag_0=beers&search_simple=1&action=process&json=1&page_size=100&fields=product_name,brands,categories,alcohol_value,generic_name,quantity,image_url,url`;
            const res2 = await fetch(url2, {
              headers: { "User-Agent": "BelgiumBeerWhisperer/1.0" },
            });
            if (res2.ok) {
              const data2 = await res2.json();
              products.push(...(data2.products || []));
            }
          }
        }

        if (products.length > 0) {
          // Convert to markdown-like format for AI extraction
          const lines = products.map((p: any, i: number) => {
            const name = p.product_name || "Unknown";
            const brand = p.brands || "";
            const abv = p.alcohol_value ? `${p.alcohol_value}%` : "";
            const desc = p.generic_name || "";
            return `${i + 1}. ${name} | Brand: ${brand} | ABV: ${abv} | ${desc}`;
          }).join("\n");

          const markdown = `# OpenFoodFacts results for "${brewery.name}"\n\n${lines}`;
          sources.push({
            name: "OpenFoodFacts",
            url: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchName}&tag_0=beers`,
            markdown,
          });

          console.log(`  OpenFoodFacts: found ${products.length} products`);
        } else {
          console.log(`  OpenFoodFacts: no results for "${brewery.name}"`);
        }
      } catch (e) {
        console.error(`  OpenFoodFacts error:`, (e as Error).message);
      }
    })();

    await Promise.allSettled([
      websitePromise,
      untappdPromise,
      openFoodPromise,
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
