import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Bulk enrichment pipeline for ONE brewery at a time.
 * Steps: scrape all sources → deduplicate vs existing DB → auto-import new → return stats.
 * The frontend loops through all breweries calling this sequentially.
 *
 * Body: { brewery_id: string } OR { brewery_id: "next", skip_recent_hours?: number }
 *   - "next" picks the next brewery that hasn't been scraped recently
 */
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
    const body = await req.json();
    let breweryId = body.brewery_id;
    const skipRecentHours = body.skip_recent_hours ?? 24;

    // "next" mode: pick the next unscraped brewery
    if (breweryId === "next") {
      const cutoff = new Date(Date.now() - skipRecentHours * 3600 * 1000).toISOString();
      
      // Get breweries with website that haven't been scraped recently
      const { data: candidates } = await supabase
        .from("breweries")
        .select("id, name")
        .not("website_url", "is", null)
        .or(`last_scraped_at.is.null,last_scraped_at.lt.${cutoff}`)
        .order("last_scraped_at", { ascending: true, nullsFirst: true })
        .limit(1);

      if (!candidates || candidates.length === 0) {
        return new Response(
          JSON.stringify({ done: true, message: "Alle brouwerijen zijn recent verwerkt" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      breweryId = candidates[0].id;
    }

    if (!breweryId) {
      return new Response(JSON.stringify({ error: "brewery_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get brewery info
    const { data: brewery, error: bErr } = await supabase
      .from("breweries")
      .select("id, name, website_url")
      .eq("id", breweryId)
      .single();
    if (bErr || !brewery) {
      return new Response(JSON.stringify({ error: "Brewery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing beers for this brewery
    const { data: existingBeers } = await supabase
      .from("beers")
      .select("id, name")
      .eq("brewery_id", breweryId);

    const existingNames = new Set(
      (existingBeers || []).map(b => b.name.toLowerCase().trim())
    );

    console.log(`Bulk enrich: ${brewery.name} (${existingNames.size} existing beers)`);

    // Step 1: Call scrape-brewery-beers in bulk mode
    const scrapeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/scrape-brewery-beers`;
    const scrapeRes = await fetch(scrapeUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ brewery_id: breweryId, mode: "bulk" }),
    });

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error(`Scrape failed for ${brewery.name}:`, errText);
      return new Response(
        JSON.stringify({
          brewery_id: breweryId,
          brewery_name: brewery.name,
          error: `Scrape failed: ${scrapeRes.status}`,
          scraped: 0, new_imported: 0, skipped_existing: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scrapeData = await scrapeRes.json();
    const scrapedBeers = scrapeData.beers || [];
    const sourceCount = scrapeData.sources?.length || 0;

    // Step 2: Filter out beers that already exist
    const newBeers = scrapedBeers.filter((b: any) => {
      const normalizedName = (b.name || "").toLowerCase().trim();
      // Also check without brewery name prefix
      const brewLower = brewery.name.toLowerCase();
      const altName = normalizedName.startsWith(brewLower + " ")
        ? normalizedName.slice(brewLower.length + 1)
        : normalizedName;
      
      return !existingNames.has(normalizedName) && !existingNames.has(altName);
    });

    const skippedExisting = scrapedBeers.length - newBeers.length;

    // Step 3: Auto-import new beers
    let imported = 0;
    if (newBeers.length > 0) {
      const rows = newBeers.map((b: any) => ({
        name: b.name,
        brewery_id: breweryId,
        style: b.style || "Unknown",
        abv: b.abv || null,
        description: b.description || null,
        source_url: b.source_url || null,
      }));

      // Insert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from("beers").insert(batch);
        if (error) {
          console.error(`Insert error for ${brewery.name}:`, error.message);
        } else {
          imported += batch.length;
        }
      }
    }

    console.log(
      `Bulk enrich ${brewery.name}: ${sourceCount} sources, ${scrapedBeers.length} scraped, ${newBeers.length} new, ${imported} imported, ${skippedExisting} skipped`
    );

    // Count remaining unscraped breweries
    const cutoff = new Date(Date.now() - (skipRecentHours) * 3600 * 1000).toISOString();
    const { count: remaining } = await supabase
      .from("breweries")
      .select("id", { count: "exact", head: true })
      .not("website_url", "is", null)
      .or(`last_scraped_at.is.null,last_scraped_at.lt.${cutoff}`);

    return new Response(
      JSON.stringify({
        brewery_id: breweryId,
        brewery_name: brewery.name,
        sources: sourceCount,
        scraped: scrapedBeers.length,
        new_imported: imported,
        skipped_existing: skippedExisting,
        rejected: scrapeData.rejected?.length || 0,
        remaining: remaining || 0,
        done: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Bulk enrich error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
