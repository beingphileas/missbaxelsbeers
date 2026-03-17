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
    { global: { headers: { Authorization: authHeader } } }
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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

    // Get brewery info
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

    if (!brewery.website_url) {
      return new Response(
        JSON.stringify({ error: "Brewery has no website URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Scrape website with Firecrawl
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let websiteUrl = brewery.website_url.trim();
    if (!websiteUrl.startsWith("http")) websiteUrl = "https://" + websiteUrl;

    console.log(`Scraping ${websiteUrl} for brewery ${brewery.name}`);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: websiteUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok || !scrapeData.success) {
      console.error("Firecrawl error:", JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ error: `Scrape failed: ${scrapeData.error || scrapeRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({ error: "No usable content found on website", beers: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate to ~8000 chars to fit within token limits
    const truncated = markdown.substring(0, 8000);

    // Step 2: Extract beer data with AI
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a beer data extraction expert. Extract all beers/products from the given brewery website content.
For each beer, extract: name, style (e.g. Tripel, Blond, IPA, Dubbel, Witbier, Stout, etc.), abv (alcohol percentage as a number), and a short description.
If a field is not found, leave it empty. Be thorough — find every beer mentioned.
IMPORTANT: Only extract actual beer products, not events, merchandise, or other items.`,
          },
          {
            role: "user",
            content: `Extract all beers from this brewery website content for "${brewery.name}":\n\n${truncated}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_beers",
              description: "Return all beers found on the brewery website",
              parameters: {
                type: "object",
                properties: {
                  beers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Beer name" },
                        style: { type: "string", description: "Beer style (Tripel, Blond, IPA, etc.)" },
                        abv: { type: "number", description: "Alcohol percentage" },
                        description: { type: "string", description: "Short description of the beer" },
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
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op, voeg credits toe in Settings → Workspace → Usage" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    let beers: any[] = [];

    // Parse tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        beers = parsed.beers || [];
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }
    }

    // Enrich with brewery info
    const enriched = beers.map((b: any) => ({
      name: b.name || "",
      style: b.style || "",
      abv: b.abv || null,
      description: b.description || "",
      brewery: brewery.name,
      brewery_id: brewery.id,
      source_url: websiteUrl,
    }));

    console.log(`Extracted ${enriched.length} beers from ${brewery.name}`);

    return new Response(
      JSON.stringify({
        brewery_name: brewery.name,
        source_url: websiteUrl,
        beers: enriched,
        raw_content_length: markdown.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scrape error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
