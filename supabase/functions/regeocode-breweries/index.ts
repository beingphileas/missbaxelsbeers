import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Nominatim free geocoder (1 req/sec policy)
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=be`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MissBaxelsBeers/1.0 (beer-map-project)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: claims, error: authErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (authErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "duplicates"; // "duplicates" | "all" | "ids"
    const ids: string[] = body.ids || [];

    // Find breweries to re-geocode
    let query = supabase.from("breweries").select("id, name, address, lat, lng");

    if (mode === "ids" && ids.length > 0) {
      query = query.in("id", ids);
    } else if (mode === "duplicates") {
      // Get all breweries, then filter for duplicate coords client-side
    }

    const { data: breweries, error } = await query;
    if (error) throw error;

    let toProcess = breweries || [];

    if (mode === "duplicates") {
      // Find coords that appear more than once
      const coordCount = new Map<string, number>();
      for (const b of toProcess) {
        const key = `${b.lat.toFixed(6)},${b.lng.toFixed(6)}`;
        coordCount.set(key, (coordCount.get(key) || 0) + 1);
      }
      const dupCoords = new Set(
        [...coordCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)
      );
      toProcess = toProcess.filter(
        b => dupCoords.has(`${b.lat.toFixed(6)},${b.lng.toFixed(6)}`)
      );
    }

    // Filter to only those with addresses
    toProcess = toProcess.filter(b => b.address && b.address.trim().length > 5);

    const results: { name: string; old: string; new_coords: string; status: string }[] = [];
    let fixed = 0;
    let failed = 0;

    for (const b of toProcess) {
      // Respect Nominatim 1 req/sec
      await sleep(1100);

      const coords = await geocode(b.address);
      if (!coords) {
        // Try with just city name from address
        const cityMatch = b.address.match(/\d{4}\s+(.+?)$/);
        if (cityMatch) {
          await sleep(1100);
          const coords2 = await geocode(cityMatch[1] + ", Belgium");
          if (coords2) {
            // Add small offset to prevent stacking
            coords2.lat += (Math.random() - 0.5) * 0.003;
            coords2.lng += (Math.random() - 0.5) * 0.003;
            
            const { error: uErr } = await supabase
              .from("breweries")
              .update({ lat: coords2.lat, lng: coords2.lng })
              .eq("id", b.id);

            results.push({
              name: b.name,
              old: `${b.lat.toFixed(5)},${b.lng.toFixed(5)}`,
              new_coords: `${coords2.lat.toFixed(5)},${coords2.lng.toFixed(5)}`,
              status: uErr ? `error: ${uErr.message}` : "fixed (city-level)",
            });
            if (!uErr) fixed++;
            continue;
          }
        }

        results.push({
          name: b.name,
          old: `${b.lat.toFixed(5)},${b.lng.toFixed(5)}`,
          new_coords: "-",
          status: "geocode failed",
        });
        failed++;
        continue;
      }

      const { error: uErr } = await supabase
        .from("breweries")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", b.id);

      results.push({
        name: b.name,
        old: `${b.lat.toFixed(5)},${b.lng.toFixed(5)}`,
        new_coords: `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`,
        status: uErr ? `error: ${uErr.message}` : "fixed",
      });
      if (!uErr) fixed++;
    }

    return new Response(
      JSON.stringify({
        total_processed: toProcess.length,
        fixed,
        failed,
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
