import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BELGIUM_BOUNDS = {
  minLat: 49.4,
  maxLat: 51.6,
  minLng: 2.4,
  maxLng: 6.4,
};

const postalPrefixCoords: Record<number, [number, number]> = {
  10: [50.8503, 4.3517], 11: [50.8467, 4.3525], 12: [50.82, 4.38],
  13: [50.6667, 4.6167], 14: [50.7167, 4.4833], 15: [50.7333, 4.2333],
  16: [50.8833, 4.25], 17: [50.75, 4.35], 18: [50.9167, 4.4333],
  19: [50.8667, 4.45], 20: [51.2194, 4.4025], 21: [51.21, 4.42],
  22: [51.1667, 4.8333], 23: [51.3167, 4.95], 24: [51.2, 5.1],
  25: [51.1333, 4.5667], 26: [51.15, 4.4333], 27: [51.05, 4.4833],
  28: [51.0667, 4.5], 29: [51.25, 4.4667], 30: [50.8794, 4.7005],
  31: [50.95, 4.7], 32: [50.8667, 4.8333], 33: [50.7833, 4.9333],
  34: [50.75, 5.0833], 35: [50.9308, 5.3325], 36: [50.9667, 5.5],
  37: [50.7833, 5.45], 38: [50.8167, 5.1667], 39: [51.15, 5.6],
  40: [50.6326, 5.5674], 41: [50.5833, 5.4167], 42: [50.5833, 5.4167],
  43: [50.6833, 5.2333], 44: [50.65, 5.5], 45: [50.6333, 5.5],
  46: [50.7333, 5.7], 47: [50.45, 6.0], 48: [50.5833, 5.8667],
  49: [50.4833, 5.8667], 50: [50.4637, 4.8675], 51: [50.45, 4.8],
  52: [50.4, 4.75], 53: [50.3, 5.0833], 54: [50.4, 5.0],
  55: [50.25, 5.0], 56: [50.3333, 4.8667], 57: [50.1333, 4.5833],
  58: [50.0833, 4.5], 59: [50.05, 4.5], 60: [50.4107, 4.4444],
  61: [50.45, 4.5], 62: [50.4167, 4.3333], 63: [50.3, 4.4167],
  64: [50.05, 4.3167], 65: [50.0167, 4.5833], 66: [49.9333, 5.4167],
  67: [49.85, 5.35], 68: [49.6833, 5.55], 69: [50.2333, 5.35],
  70: [50.455, 3.956], 71: [50.4667, 4.1833], 72: [50.5, 4.1],
  73: [50.45, 3.8333], 74: [50.6, 3.5], 75: [50.6, 3.3833],
  76: [50.5, 3.6], 77: [50.6333, 3.7833], 78: [50.6833, 3.8333],
  79: [50.6, 3.5833], 80: [51.2093, 3.2247], 81: [51.1833, 3.2],
  82: [51.0833, 3.1], 83: [51.1333, 3.05], 84: [51.2, 2.9333],
  85: [50.85, 3.25], 86: [50.85, 2.8833], 87: [50.9, 3.2167],
  88: [50.9333, 3.1167], 89: [50.85, 2.8833], 90: [51.0536, 3.7253],
  91: [51.0833, 3.9333], 92: [51.0167, 4.1], 93: [50.9333, 4.0333],
  94: [50.85, 3.95], 95: [50.8667, 3.8833], 96: [50.8333, 3.6],
  97: [50.85, 3.6], 98: [51.0, 3.5333], 99: [51.1833, 3.5333],
};

const provinceCentre: Record<string, [number, number]> = {
  "Antwerp": [51.22, 4.4],
  "Brussels": [50.85, 4.35],
  "East Flanders": [51.05, 3.73],
  "Flemish Brabant": [50.88, 4.7],
  "Hainaut": [50.45, 3.95],
  "Limburg": [50.93, 5.33],
  "Liège": [50.63, 5.57],
  "Luxembourg": [49.9, 5.4],
  "Namur": [50.47, 4.87],
  "Walloon Brabant": [50.65, 4.45],
  "West Flanders": [51.05, 3.1],
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

function extractPostalCode(address: string): number | null {
  const match = address.match(/\b(\d{4})\b/);
  if (!match) return null;
  const pc = parseInt(match[1], 10);
  return pc >= 1000 && pc <= 9999 ? pc : null;
}

function postalPrefixWithinRange(lat: number, lng: number, postalCode: number): boolean {
  const prefix = Math.floor(postalCode / 100);
  const ref = postalPrefixCoords[prefix];
  if (!ref) return true;
  const dLat = Math.abs(lat - ref[0]);
  const dLng = Math.abs(lng - ref[1]);
  return dLat <= 0.26 && dLng <= 0.35;
}

function withinBelgium(lat: number, lng: number): boolean {
  return lat >= BELGIUM_BOUNDS.minLat && lat <= BELGIUM_BOUNDS.maxLat && lng >= BELGIUM_BOUNDS.minLng && lng <= BELGIUM_BOUNDS.maxLng;
}

function parseAddressCandidates(address: string): string[] {
  const clean = address.replace(/\s+/g, " ").trim();
  const candidates = new Set<string>();
  const m = clean.match(/^(.*?)[,\s]+(\d{4})\s+(.+)$/);

  if (m) {
    const street = m[1].trim();
    const postal = m[2].trim();
    const city = m[3].trim();
    candidates.add(`${street}, ${postal} ${city}, Belgium`);
    candidates.add(`${postal} ${city}, Belgium`);
    candidates.add(`${city}, Belgium`);
  }

  candidates.add(`${clean}, Belgium`);
  candidates.add(clean);
  return [...candidates].filter(Boolean);
}

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number; postcode?: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=be&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MissBaxelsBeers/1.0 (beer-map-project)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!withinBelgium(lat, lng)) return null;

    const postcode = data[0]?.address?.postcode as string | undefined;
    return { lat, lng, postcode };
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeBelgianAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const postal = extractPostalCode(address);
  const candidates = parseAddressCandidates(address);

  for (const query of candidates) {
    await sleep(1100); // respect Nominatim rate-limit
    const result = await geocodeQuery(query);
    if (!result) continue;

    if (postal) {
      const pc = result.postcode?.match(/\d{4}/)?.[0];
      const samePostal = pc ? parseInt(pc, 10) === postal : false;
      if (!samePostal && !postalPrefixWithinRange(result.lat, result.lng, postal)) {
        continue;
      }
    }

    return { lat: result.lat, lng: result.lng };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const { breweries: incoming, mode = "sync" } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await supabase.from("breweries").select("id, name, province, type, address, phone, email, website_url, lat, lng");
    const existingMap = new Map<string, any>();
    for (const b of (existing || [])) {
      existingMap.set(normalizeForMatch(b.name), b);
    }

    const incomingMap = new Map<string, any>();
    for (const b of incoming) {
      const name = (b.name || "").trim();
      const code = (b.code || "").trim();
      if (!name || code.startsWith("U")) continue;

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

    const toInsert: any[] = [];
    for (const [key, inc] of incomingMap) {
      const ex = existingMap.get(key);
      if (ex) {
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
        toInsert.push(inc);
      }
    }

    const insertBatch: any[] = [];
    for (const inc of toInsert) {
      let coords: { lat: number; lng: number } | null = null;

      if (inc.address && inc.address.trim().length > 5) {
        coords = await geocodeBelgianAddress(inc.address);
        if (coords) geocodedCount++;
      }

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
