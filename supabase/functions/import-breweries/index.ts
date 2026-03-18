import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Province centres (fallback when geocoding fails) ──
const provinceCentre: Record<string, [number, number]> = {
  "Antwerp": [51.22, 4.40],
  "Brussels": [50.85, 4.35],
  "East Flanders": [51.05, 3.73],
  "Flemish Brabant": [50.88, 4.70],
  "Hainaut": [50.45, 3.95],
  "Limburg": [50.93, 5.33],
  "Liège": [50.63, 5.57],
  "Luxembourg": [49.90, 5.40],
  "Namur": [50.47, 4.87],
  "Walloon Brabant": [50.65, 4.45],
  "West Flanders": [51.05, 3.10],
};

const provinceMap: Record<string, string> = {
  "Antwerpen": "Antwerp",
  "Brussels Hoofdstedelijk Gewest": "Brussels",
  "Henegouwen": "Hainaut",
  "Limburg": "Limburg",
  "Luik": "Liège",
  "Luxemburg": "Luxembourg",
  "Namen": "Namur",
  "Oost-Vlaanderen": "East Flanders",
  "Vlaams-Brabant": "Flemish Brabant",
  "Waals-Brabant": "Walloon Brabant",
  "West-Vlaanderen": "West Flanders",
};

const trappists = new Set([
  "brouwerij der trappisten van westmalle",
  "brasserie de l'abbaye n.d. de scourmont",
  "brasserie d'orval",
  "abbaye saint-rémy",
  "abdij sint-sixtus",
  "de achelse kluis",
]);

const industrial = new Set([
  "ab inbev", "alken-maes", "brouwerij duvel moortgat",
  "brouwerij haacht", "swinkels family brewers belgium",
  "brouwerij martens",
]);

function classifyType(name: string, code: string): string {
  const lower = name.toLowerCase();
  if (trappists.has(lower)) return "Trappist";
  if (industrial.has(lower)) return "Industrial";
  if (code.startsWith("S")) return "Sub-site";
  if (code.startsWith("C")) return "Contract brewer";
  if (code.startsWith("N")) return "Blender/Stekerij";
  if (lower.includes("famille") || lower.includes("family") || lower.includes("frères")) return "Family-owned";
  return "Microbrewery";
}

function cleanWebsite(url: string): string {
  if (!url) return "";
  url = url.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  url = url.replace(/\\/g, "");
  if (url && !url.startsWith("http")) url = "https://" + url;
  return url;
}

function cleanEmail(email: string): string {
  if (!email) return "";
  return email.replace(/\\/g, "").replace("@", "@");
}

function normalizeForMatch(name: string): string {
  return name.toLowerCase().trim().replace(/[''`]/g, "'").replace(/\s+/g, " ");
}

// ── Nominatim geocoding (1 req/sec) ──
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=be`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MissBaxelsBeers/1.0 (beer-map-project)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const { breweries: incoming, mode = "sync" } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch ALL existing breweries
    const { data: existing } = await supabase.from("breweries").select("id, name, province, type, address, phone, email, website_url, lat, lng");
    const existingMap = new Map<string, any>();
    for (const b of (existing || [])) {
      existingMap.set(normalizeForMatch(b.name), b);
    }

    // Build incoming map (skip U-codes = secondary usage sites)
    const incomingMap = new Map<string, any>();
    for (const b of incoming) {
      const name = (b.name || "").trim();
      const code = (b.code || "").trim();
      if (code.startsWith("U")) continue;

      const key = normalizeForMatch(name);
      if (incomingMap.has(key)) continue;

      const province = provinceMap[b.province] || b.province || "Brussels";

      incomingMap.set(key, {
        name,
        type: classifyType(name, code),
        province,
        address: b.address || "",
        phone: b.phone || "",
        email: cleanEmail(b.email || ""),
        website_url: cleanWebsite(b.website || ""),
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;
    let geocodedCount = 0;
    let fallbackCount = 0;

    // 1. DELETE: breweries in DB but not in incoming list (sync mode)
    if (mode === "sync") {
      const toDelete: string[] = [];
      for (const [key, dbRow] of existingMap) {
        if (!incomingMap.has(key)) {
          toDelete.push(dbRow.id);
        }
      }
      if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 50) {
          const batch = toDelete.slice(i, i + 50);
          const { error } = await supabase.from("breweries").delete().in("id", batch);
          if (error) console.error("Delete error:", error.message);
          else deletedCount += batch.length;
        }
      }
    }

    // 2. UPDATE existing + collect new for INSERT
    const toInsert: any[] = [];
    for (const [key, inc] of incomingMap) {
      const ex = existingMap.get(key);
      if (ex) {
        // Update metadata fields (never overwrite existing coords)
        const updates: Record<string, any> = {};
        if (inc.province !== ex.province) updates.province = inc.province;
        if (inc.type !== ex.type) updates.type = inc.type;
        if (inc.address && inc.address !== ex.address) updates.address = inc.address;
        if (inc.phone && inc.phone !== ex.phone) updates.phone = inc.phone;
        if (inc.email && inc.email !== ex.email) updates.email = inc.email;
        if (inc.website_url && inc.website_url !== ex.website_url) updates.website_url = inc.website_url;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("breweries").update(updates).eq("id", ex.id);
          if (error) console.error(`Update error for ${inc.name}:`, error.message);
          else updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // New brewery — needs geocoding
        toInsert.push(inc);
      }
    }

    // 3. Geocode new breweries and INSERT
    const insertBatch: any[] = [];
    for (const inc of toInsert) {
      let coords: { lat: number; lng: number } | null = null;

      // Try full address geocoding
      if (inc.address && inc.address.trim().length > 5) {
        await sleep(1100); // Nominatim rate limit
        coords = await geocodeAddress(inc.address);
        if (coords) {
          geocodedCount++;
        } else {
          // Try city from address (e.g. "1234 CityName")
          const cityMatch = inc.address.match(/\d{4}\s+(.+?)$/);
          if (cityMatch) {
            await sleep(1100);
            coords = await geocodeAddress(cityMatch[1] + ", Belgium");
            if (coords) geocodedCount++;
          }
        }
      }

      // Fallback: province centre
      if (!coords) {
        const centre = provinceCentre[inc.province] || [50.85, 4.35];
        coords = { lat: centre[0], lng: centre[1] };
        fallbackCount++;
        console.log(`Fallback for ${inc.name}: using ${inc.province} centre`);
      }

      insertBatch.push({
        name: inc.name,
        type: inc.type,
        province: inc.province,
        lat: coords.lat,
        lng: coords.lng,
        address: inc.address,
        phone: inc.phone,
        email: inc.email,
        website_url: inc.website_url,
        story: "",
      });
    }

    // Batch insert
    for (let i = 0; i < insertBatch.length; i += 50) {
      const batch = insertBatch.slice(i, i + 50);
      const { error } = await supabase.from("breweries").insert(batch);
      if (error) {
        console.error(`Insert batch error:`, error.message);
        return new Response(
          JSON.stringify({ error: error.message, insertedSoFar: insertedCount }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      insertedCount += batch.length;
    }

    return new Response(
      JSON.stringify({
        inserted: insertedCount,
        updated: updatedCount,
        deleted: deletedCount,
        unchanged: skippedCount,
        geocoded: geocodedCount,
        fallback: fallbackCount,
        total_incoming: incomingMap.size,
        total_existing: existingMap.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
