import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const mode = body.mode || "all";
    const batchSize = body.batch_size || 40;
    const offset = body.offset || 0;

    const { data: venues, error } = await supabase
      .from("venues")
      .select("id, name, address, lat, lng")
      .order("name");

    if (error) throw error;

    let toProcess = (venues || []).filter(v => v.address && v.address.trim().length > 5);

    if (mode === "duplicates") {
      const coordCount = new Map<string, number>();
      for (const v of toProcess) {
        const key = `${v.lat.toFixed(6)},${v.lng.toFixed(6)}`;
        coordCount.set(key, (coordCount.get(key) || 0) + 1);
      }
      const dupCoords = new Set(
        [...coordCount.entries()].filter(([, c]) => c > 1).map(([k]) => k)
      );
      toProcess = toProcess.filter(
        v => dupCoords.has(`${v.lat.toFixed(6)},${v.lng.toFixed(6)}`)
      );
    }

    const totalEligible = toProcess.length;
    toProcess = toProcess.slice(offset, offset + batchSize);

    let fixed = 0;
    let failed = 0;
    const results: { name: string; old: string; new_coords: string; status: string }[] = [];

    for (const v of toProcess) {
      await sleep(1100);

      let coords = await geocode(v.address);

      if (!coords) {
        const cityMatch = v.address.match(/\d{4}\s+(.+?)$/);
        if (cityMatch) {
          await sleep(1100);
          coords = await geocode(cityMatch[1] + ", Belgium");
        }
      }

      if (!coords) {
        results.push({ name: v.name, old: `${v.lat.toFixed(5)},${v.lng.toFixed(5)}`, new_coords: "-", status: "geocode failed" });
        failed++;
        continue;
      }

      const { error: uErr } = await supabase.from("venues").update({ lat: coords.lat, lng: coords.lng }).eq("id", v.id);

      results.push({
        name: v.name,
        old: `${v.lat.toFixed(5)},${v.lng.toFixed(5)}`,
        new_coords: `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`,
        status: uErr ? `error: ${uErr.message}` : "fixed",
      });
      if (!uErr) fixed++;
    }

    const nextOffset = offset + batchSize;
    const hasMore = nextOffset < totalEligible;

    return new Response(
      JSON.stringify({ total_eligible: totalEligible, batch_processed: toProcess.length, offset, next_offset: hasMore ? nextOffset : null, has_more: hasMore, fixed, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
