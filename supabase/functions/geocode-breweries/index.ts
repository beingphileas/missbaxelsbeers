import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Clean up the address for geocoding
  let query = address.trim();
  // Ensure Belgium is in the query
  if (!query.toLowerCase().includes("belgium") && !query.toLowerCase().includes("belgique") && !query.toLowerCase().includes("belgië")) {
    query += ", Belgium";
  }

  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "be",
    });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BelgiumBeerWhisperer/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Delay helper to respect Nominatim rate limit (1 req/sec)
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 50;
    const offset = body.offset || 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get breweries with addresses, ordered by name for consistent batching
    const { data: breweries, error } = await supabase
      .from("breweries")
      .select("id, name, address, lat, lng")
      .not("address", "is", null)
      .neq("address", "")
      .order("name")
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    const results: { name: string; old: string; new: string; status: string }[] = [];
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const b of breweries || []) {
      if (!b.address || b.address.trim().length < 5) {
        skipped++;
        continue;
      }

      // Rate limit: Nominatim allows max 1 request per second
      await delay(1100);

      const coords = await geocodeAddress(b.address);

      if (!coords) {
        // Try with just postal code + city (extract from address)
        const pcMatch = b.address.match(/\b(\d{4})\s+([A-Za-zÀ-ÿ\-\s]+)/);
        if (pcMatch) {
          await delay(1100);
          const fallback = await geocodeAddress(`${pcMatch[1]} ${pcMatch[2]}, Belgium`);
          if (fallback) {
            const { error: uErr } = await supabase
              .from("breweries")
              .update({ lat: fallback.lat, lng: fallback.lng })
              .eq("id", b.id);
            if (!uErr) {
              results.push({
                name: b.name,
                old: `${b.lat.toFixed(4)},${b.lng.toFixed(4)}`,
                new: `${fallback.lat.toFixed(4)},${fallback.lng.toFixed(4)}`,
                status: "updated (fallback)",
              });
              updated++;
              continue;
            }
          }
        }
        results.push({ name: b.name, old: b.address, new: "", status: "geocode failed" });
        failed++;
        continue;
      }

      const { error: uErr } = await supabase
        .from("breweries")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", b.id);

      if (uErr) {
        results.push({ name: b.name, old: "", new: "", status: `db error: ${uErr.message}` });
        failed++;
      } else {
        results.push({
          name: b.name,
          old: `${b.lat.toFixed(4)},${b.lng.toFixed(4)}`,
          new: `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`,
          status: "updated",
        });
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        updated,
        failed,
        skipped,
        total_processed: (breweries || []).length,
        offset,
        next_offset: offset + batchSize,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
