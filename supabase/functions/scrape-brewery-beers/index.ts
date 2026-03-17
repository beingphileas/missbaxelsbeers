import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Scrape a single URL via Firecrawl
async function scrapeUrl(url: string, firecrawlKey: string): Promise<string> {
  let formatted = url.trim();
  if (!formatted.startsWith("http")) formatted = "https://" + formatted;

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: formatted,
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) return "";
  return data.data?.markdown || data.markdown || "";
}

// Search the web for brewery beers via Firecrawl
async function searchWeb(query: string, firecrawlKey: string): Promise<{ url: string; markdown: string }[]> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) return [];
  return (data.data || []).map((r: any) => ({
    url: r.url || "",
    markdown: (r.markdown || "").substring(0, 4000),
  }));
}

// Extract beers from markdown via AI
async function extractBeers(
  markdown: string,
  breweryName: string,
  sourceName: string,
  lovableKey: string,
): Promise<any[]> {
  if (!markdown || markdown.length < 30) return [];

  const truncated = markdown.substring(0, 8000);

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
          content: `You are a beer data extraction expert. Extract all beers from the given content that belong to the brewery "${breweryName}".
For each beer extract: name, style (e.g. Tripel, Blond, IPA, Dubbel, Witbier, Stout), abv (number), description (short).
ONLY include beers that clearly belong to "${breweryName}". Skip unrelated beers, events, merchandise.
If no beers from this brewery are found, return an empty array.`,
        },
        {
          role: "user",
          content: `Extract beers for "${breweryName}" from this ${sourceName} content:\n\n${truncated}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_beers",
            description: "Return all beers found",
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

  // Verify admin
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

    // Gather content from multiple sources in parallel
    const sources: { name: string; url: string; markdown: string }[] = [];

    // Source 1: Brewery's own website
    const websitePromise = brewery.website_url
      ? scrapeUrl(brewery.website_url, firecrawlKey).then((md) => {
          if (md && md.length > 50) {
            let url = brewery.website_url!.trim();
            if (!url.startsWith("http")) url = "https://" + url;
            sources.push({ name: "Eigen website", url, markdown: md });
          }
        })
      : Promise.resolve();

    // Source 2: Web search for beers on known Belgian beer databases
    const searchPromise = searchWeb(
      `"${brewery.name}" bieren site:belgenbier.be OR site:ratebeer.com OR site:untappd.com OR site:beeradvocate.com`,
      firecrawlKey,
    ).then((results) => {
      for (const r of results) {
        if (r.markdown && r.markdown.length > 30) {
          sources.push({ name: new URL(r.url).hostname, url: r.url, markdown: r.markdown });
        }
      }
    });

    // Source 3: General web search
    const generalSearchPromise = searchWeb(
      `"${brewery.name}" Belgian brewery beer list`,
      firecrawlKey,
    ).then((results) => {
      for (const r of results) {
        // Skip if we already have this domain
        const domain = new URL(r.url).hostname;
        if (!sources.find((s) => s.url === r.url) && r.markdown && r.markdown.length > 30) {
          sources.push({ name: domain, url: r.url, markdown: r.markdown });
        }
      }
    });

    await Promise.allSettled([websitePromise, searchPromise, generalSearchPromise]);

    console.log(`Found ${sources.length} sources for ${brewery.name}: ${sources.map((s) => s.name).join(", ")}`);

    if (sources.length === 0) {
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
    const allBeers: { name: string; style: string; abv: number | null; description: string; source: string; source_url: string }[] = [];

    const extractionPromises = sources.map((source) =>
      extractBeers(source.markdown, brewery.name, source.name, lovableKey).then((beers) => {
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

    await Promise.allSettled(extractionPromises);

    // Deduplicate beers by name (case-insensitive), keep the one with most data
    const deduped = new Map<string, (typeof allBeers)[0]>();
    for (const beer of allBeers) {
      const key = beer.name.toLowerCase().trim();
      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, beer);
      } else {
        // Keep the version with more info
        const score = (b: typeof beer) =>
          (b.style ? 1 : 0) + (b.abv ? 1 : 0) + (b.description ? 1 : 0);
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

    console.log(`Extracted ${allBeers.length} raw → ${enriched.length} unique beers from ${sources.length} sources`);

    return new Response(
      JSON.stringify({
        brewery_name: brewery.name,
        sources: sources.map((s) => ({ name: s.name, url: s.url })),
        beers: enriched,
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
