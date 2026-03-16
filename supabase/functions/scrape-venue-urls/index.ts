import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(
      JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get batch size and offset from request
  const { batchSize = 5, offset = 0 } = await req.json().catch(() => ({}));

  // Fetch venues that need URLs scraped
  const { data: venues, error: fetchErr } = await supabase
    .from("venues")
    .select("id, name, address, province")
    .order("name")
    .range(offset, offset + batchSize - 1);

  if (fetchErr) {
    return new Response(
      JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!venues || venues.length === 0) {
    return new Response(
      JSON.stringify({ message: "No more venues to process", done: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: any[] = [];

  for (const venue of venues) {
    const searchQuery = `${venue.name} ${venue.address || venue.province} Belgium`;
    console.log(`Searching: ${searchQuery}`);

    try {
      // Use Firecrawl search to find real URLs
      const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `${venue.name} Belgium beer`,
          limit: 10,
        }),
      });

      const searchData = await searchResponse.json();

      let googleUrl: string | null = null;
      let tripadvisorUrl: string | null = null;
      let untappdUrl: string | null = null;

      if (searchData.success && searchData.data) {
        for (const result of searchData.data) {
          const url = result.url || "";

          // Extract Google Maps URL
          if (!googleUrl && (url.includes("google.com/maps") || url.includes("goo.gl/maps"))) {
            googleUrl = url;
          }

          // Extract TripAdvisor URL
          if (!tripadvisorUrl && url.includes("tripadvisor.com") && url.includes("Review")) {
            tripadvisorUrl = url;
          }

          // Extract Untappd URL
          if (!untappdUrl && url.includes("untappd.com/v/")) {
            untappdUrl = url;
          }
        }
      }

      // If we didn't find specific URLs from general search, do targeted searches
      if (!tripadvisorUrl) {
        try {
          const taSearch = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `site:tripadvisor.com "${venue.name}" Belgium`,
              limit: 3,
            }),
          });
          const taData = await taSearch.json();
          if (taData.success && taData.data) {
            for (const r of taData.data) {
              if (r.url?.includes("tripadvisor.com")) {
                tripadvisorUrl = r.url;
                break;
              }
            }
          }
        } catch (e) {
          console.log(`TripAdvisor search failed for ${venue.name}:`, e);
        }
      }

      if (!untappdUrl) {
        try {
          const utSearch = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `site:untappd.com "${venue.name}"`,
              limit: 3,
            }),
          });
          const utData = await utSearch.json();
          if (utData.success && utData.data) {
            for (const r of utData.data) {
              if (r.url?.includes("untappd.com/v/")) {
                untappdUrl = r.url;
                break;
              }
            }
          }
        } catch (e) {
          console.log(`Untappd search failed for ${venue.name}:`, e);
        }
      }

      // Keep working Google Maps search URL as fallback
      const city = venue.address
        ? venue.address.split(",").pop()?.trim()
        : venue.province;
      const fallbackGoogle = `https://www.google.com/maps/search/${encodeURIComponent(venue.name + " " + city)}`;

      const updateData: Record<string, string | null> = {};
      if (googleUrl) updateData.google_url = googleUrl;
      else updateData.google_url = fallbackGoogle;

      if (tripadvisorUrl) updateData.tripadvisor_url = tripadvisorUrl;
      if (untappdUrl) updateData.untappd_url = untappdUrl;

      if (Object.keys(updateData).length > 0) {
        const { error: updateErr } = await supabase
          .from("venues")
          .update(updateData)
          .eq("id", venue.id);

        if (updateErr) {
          console.error(`Update failed for ${venue.name}:`, updateErr);
        }
      }

      results.push({
        name: venue.name,
        google_url: updateData.google_url || null,
        tripadvisor_url: tripadvisorUrl,
        untappd_url: untappdUrl,
      });

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error processing ${venue.name}:`, err);
      results.push({ name: venue.name, error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      nextOffset: offset + batchSize,
      totalVenues: 199,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
