import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map 2-digit Belgian postal code prefix to approximate [lat, lng]
const postalCodeToCoords = (postalCode: string): [number, number] => {
  const prefix = parseInt(postalCode.substring(0, 2));
  const m: Record<number, [number, number]> = {
    10: [50.85, 4.35], 11: [50.86, 4.38], 12: [50.83, 4.32],
    13: [50.65, 4.45], 14: [50.68, 4.48], 15: [50.75, 4.25],
    16: [50.77, 4.3], 17: [50.87, 4.25], 18: [50.92, 4.35],
    19: [50.85, 4.5], 20: [51.22, 4.4], 21: [51.2, 4.42],
    22: [51.18, 4.83], 23: [51.32, 4.95], 24: [51.2, 5.1],
    25: [51.13, 4.57], 26: [51.15, 4.43], 27: [51.03, 4.48],
    28: [51.05, 4.5], 29: [51.25, 4.5], 30: [50.88, 4.7],
    31: [50.95, 4.72], 32: [50.88, 4.83], 33: [50.8, 5.0],
    34: [50.75, 5.1], 35: [50.93, 5.33], 36: [50.97, 5.5],
    37: [50.78, 5.45], 38: [50.82, 5.19], 39: [51.15, 5.6],
    40: [50.63, 5.57], 41: [50.55, 5.4], 42: [50.55, 5.4],
    43: [50.7, 5.25], 44: [50.65, 5.5], 45: [50.65, 5.5],
    46: [50.73, 5.7], 47: [50.45, 6.0], 48: [50.59, 5.87],
    49: [50.49, 5.87], 50: [50.47, 4.87], 51: [50.45, 4.8],
    52: [50.45, 4.8], 53: [50.3, 5.1], 54: [50.4, 5.0],
    55: [50.26, 5.0], 56: [50.26, 5.0], 57: [50.15, 4.6],
    58: [50.1, 4.55], 59: [50.05, 4.5], 60: [50.41, 4.44],
    61: [50.35, 5.55], 62: [50.35, 4.35], 63: [50.3, 4.4],
    64: [50.05, 4.32], 65: [50.0, 4.3], 66: [50.05, 5.6],
    67: [49.9, 5.4], 68: [49.68, 5.55], 69: [50.23, 5.35],
    70: [50.45, 3.95], 71: [50.47, 4.19], 72: [50.5, 4.1],
    73: [50.44, 3.84], 74: [50.58, 3.5], 75: [50.61, 3.39],
    76: [50.51, 3.59], 77: [50.63, 3.78], 78: [50.7, 3.85],
    79: [50.6, 3.6], 80: [51.21, 3.23], 81: [51.21, 3.2],
    82: [51.21, 3.2], 83: [51.25, 3.28], 84: [51.22, 2.92],
    85: [50.83, 3.26], 86: [50.85, 2.87], 87: [50.91, 3.22],
    88: [50.95, 3.12], 89: [50.85, 2.88], 90: [51.05, 3.73],
    91: [51.17, 4.14], 92: [51.03, 4.1], 93: [50.94, 4.04],
    94: [50.85, 3.95], 95: [50.87, 3.88], 96: [50.83, 3.6],
    97: [50.85, 3.6], 98: [51.0, 3.53], 99: [51.18, 3.55],
  };
  return m[prefix] || [50.85, 4.35];
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
  // Code prefix: B = brewery, S = sub-site (skip), C = contract brewer
  if (code.startsWith("C")) return "Contract brewer";
  if (lower.includes("famille") || lower.includes("family") || lower.includes("frères")) return "Family-owned";
  return "Microbrewery";
}

function cleanWebsite(url: string): string {
  if (!url) return "";
  url = url.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  url = url.replace(/\\/g, "");
  if (url && !url.startsWith("http")) {
    url = "https://" + url;
  }
  return url;
}

function cleanEmail(email: string): string {
  if (!email) return "";
  return email.replace(/\\/g, "").replace("@", "@");
}

function normalizeForMatch(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ");
}

serve(async (req) => {
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
    const { data: existing } = await supabase.from("breweries").select("id, name, province, type, address, phone, email, website_url");
    const existingMap = new Map<string, any>();
    for (const b of (existing || [])) {
      existingMap.set(normalizeForMatch(b.name), b);
    }

    // Build incoming map (skip S-codes = sub-sites, they're not separate entities)
    const incomingMap = new Map<string, any>();
    for (const b of incoming) {
      const name = (b.name || "").trim();
      const code = (b.code || "").trim();
      if (!name) continue;
      // Skip sub-sites (S-codes) — they share the parent brewery entry
      if (code.startsWith("S")) continue;

      const key = normalizeForMatch(name);
      // If duplicate name in spreadsheet, keep the first
      if (incomingMap.has(key)) continue;

      const postalCode = (b.postal_code || "1000").toString();
      const [baseLat, baseLng] = postalCodeToCoords(postalCode);
      const province = provinceMap[b.province] || b.province || "Brussels";

      incomingMap.set(key, {
        name,
        type: classifyType(name, code),
        province,
        postal_code: postalCode,
        address: b.address || "",
        phone: b.phone || "",
        email: cleanEmail(b.email || ""),
        website_url: cleanWebsite(b.website || ""),
        lat: baseLat + (Math.random() - 0.5) * 0.015,
        lng: baseLng + (Math.random() - 0.5) * 0.015,
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;

    // 1. DELETE: breweries in DB but not in incoming list
    if (mode === "sync") {
      const toDelete: string[] = [];
      for (const [key, dbRow] of existingMap) {
        if (!incomingMap.has(key)) {
          toDelete.push(dbRow.id);
        }
      }
      if (toDelete.length > 0) {
        // Delete in batches of 50
        for (let i = 0; i < toDelete.length; i += 50) {
          const batch = toDelete.slice(i, i + 50);
          const { error } = await supabase.from("breweries").delete().in("id", batch);
          if (error) {
            console.error("Delete error:", error.message);
          } else {
            deletedCount += batch.length;
          }
        }
      }
    }

    // 2. UPDATE: breweries in both — update province, type, address, phone, email, website
    const toInsert: any[] = [];
    for (const [key, inc] of incomingMap) {
      const existing = existingMap.get(key);
      if (existing) {
        // Check if any field changed
        const updates: Record<string, any> = {};
        if (inc.province !== existing.province) updates.province = inc.province;
        if (inc.type !== existing.type) updates.type = inc.type;
        if (inc.address && inc.address !== existing.address) updates.address = inc.address;
        if (inc.phone && inc.phone !== existing.phone) updates.phone = inc.phone;
        if (inc.email && inc.email !== existing.email) updates.email = inc.email;
        if (inc.website_url && inc.website_url !== existing.website_url) updates.website_url = inc.website_url;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("breweries").update(updates).eq("id", existing.id);
          if (error) {
            console.error(`Update error for ${inc.name}:`, error.message);
          } else {
            updatedCount++;
          }
        } else {
          skippedCount++;
        }
      } else {
        // 3. INSERT: new breweries
        toInsert.push({
          name: inc.name,
          type: inc.type,
          province: inc.province,
          lat: inc.lat,
          lng: inc.lng,
          address: inc.address,
          phone: inc.phone,
          email: inc.email,
          website_url: inc.website_url,
          story: "",
        });
      }
    }

    // Batch insert new breweries
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
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
