import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RatingResult {
  rating: number | null;
  reviewCount: number | null;
}

async function scrapeGoogleRating(url: string, apiKey: string): Promise<RatingResult> {
  if (!url) return { rating: null, reviewCount: null };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || "";

    // Google Maps typically shows "4.5 (1,234 reviews)" or "4.5 (1.234 reviews)"
    const ratingMatch = md.match(/(\d[.,]\d)\s*(?:\/\s*5\s*)?\(([0-9.,]+)\s*(?:review|beoordelingen|avis)/i);
    if (ratingMatch) {
      return {
        rating: parseFloat(ratingMatch[1].replace(",", ".")),
        reviewCount: parseInt(ratingMatch[2].replace(/[.,]/g, ""), 10),
      };
    }
    // Fallback: just rating
    const simpleRating = md.match(/(\d[.,]\d)\s*\/\s*5/);
    return { rating: simpleRating ? parseFloat(simpleRating[1].replace(",", ".")) : null, reviewCount: null };
  } catch (e) {
    console.error("Google scrape error:", e);
    return { rating: null, reviewCount: null };
  }
}

async function scrapeTripAdvisorRating(url: string, apiKey: string): Promise<RatingResult> {
  if (!url) return { rating: null, reviewCount: null };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || "";

    // TripAdvisor: "4.5 of 5 bubbles" + "1,234 reviews"
    const ratingMatch = md.match(/(\d[.,]\d)\s*(?:of|van|sur)\s*5/i);
    const reviewMatch = md.match(/([0-9.,]+)\s*(?:review|beoordelingen|avis)/i);
    return {
      rating: ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : null,
      reviewCount: reviewMatch ? parseInt(reviewMatch[1].replace(/[.,]/g, ""), 10) : null,
    };
  } catch (e) {
    console.error("TripAdvisor scrape error:", e);
    return { rating: null, reviewCount: null };
  }
}

async function scrapeUntappdRating(url: string, apiKey: string): Promise<RatingResult> {
  if (!url) return { rating: null, reviewCount: null };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || "";

    // Untappd: "(3.85)" rating and "1,234 Ratings" or "1,234 Check-ins"
    const ratingMatch = md.match(/\((\d[.,]\d{1,2})\)/);
    const reviewMatch = md.match(/([0-9.,]+)\s*(?:Rating|Check-in|Checkin)/i);
    return {
      rating: ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : null,
      reviewCount: reviewMatch ? parseInt(reviewMatch[1].replace(/[.,]/g, ""), 10) : null,
    };
  } catch (e) {
    console.error("Untappd scrape error:", e);
    return { rating: null, reviewCount: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard — admin only
  const { error: authErr } = await requireAdmin(req, corsHeaders);
  if (authErr) return authErr;

  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { batchSize = 3, offset = 0 } = await req.json().catch(() => ({}));

  const { data: venues, error: fetchErr } = await supabase
    .from("venues")
    .select("id, name, google_url, tripadvisor_url, untappd_url")
    .order("name")
    .range(offset, offset + batchSize - 1);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!venues || venues.length === 0) {
    return new Response(JSON.stringify({ message: "No more venues to process", done: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: any[] = [];

  for (const venue of venues) {
    console.log(`Verifying ratings for: ${venue.name}`);
    const updateData: Record<string, any> = {};

    // Scrape Google
    if (venue.google_url && !venue.google_url.startsWith("https://www.google.com/maps/search/")) {
      const google = await scrapeGoogleRating(venue.google_url, FIRECRAWL_API_KEY);
      if (google.rating !== null) updateData.google_rating = google.rating;
      if (google.reviewCount !== null) updateData.google_review_count = google.reviewCount;
    }

    // Scrape TripAdvisor
    if (venue.tripadvisor_url) {
      const ta = await scrapeTripAdvisorRating(venue.tripadvisor_url, FIRECRAWL_API_KEY);
      if (ta.rating !== null) updateData.tripadvisor_rating = ta.rating;
      if (ta.reviewCount !== null) updateData.tripadvisor_review_count = ta.reviewCount;
    }

    // Scrape Untappd
    if (venue.untappd_url) {
      const ut = await scrapeUntappdRating(venue.untappd_url, FIRECRAWL_API_KEY);
      if (ut.rating !== null) updateData.untappd_rating = ut.rating;
      if (ut.reviewCount !== null) updateData.untappd_review_count = ut.reviewCount;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateErr } = await supabase
        .from("venues")
        .update(updateData)
        .eq("id", venue.id);
      if (updateErr) console.error(`Update failed for ${venue.name}:`, updateErr);
    }

    results.push({ name: venue.name, ...updateData });
    await new Promise((r) => setTimeout(r, 500));
  }

  return new Response(
    JSON.stringify({ processed: results.length, nextOffset: offset + batchSize, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
