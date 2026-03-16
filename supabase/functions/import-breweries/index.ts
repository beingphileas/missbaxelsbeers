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

// Known brewery types
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

function classifyType(name: string): string {
  const lower = name.toLowerCase();
  if (trappists.has(lower)) return "Trappist";
  if (industrial.has(lower)) return "Industrial";
  // Check for family-owned indicators
  if (lower.includes("famille") || lower.includes("family") || lower.includes("frères")) return "Family-owned";
  return "Microbrewery";
}

function cleanWebsite(url: string): string {
  if (!url) return "";
  // Remove markdown link syntax
  url = url.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove backslash escapes
  url = url.replace(/\\/g, "");
  // Add https:// if missing
  if (url && !url.startsWith("http")) {
    url = "https://" + url;
  }
  return url;
}

function cleanEmail(email: string): string {
  if (!email) return "";
  return email.replace(/\\/g, "").replace("@", "@");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { breweries } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get existing brewery names
    const { data: existing } = await supabase.from("breweries").select("name");
    const existingNames = new Set(
      (existing || []).map((b: any) => b.name.toLowerCase().trim())
    );

    const toInsert: any[] = [];

    for (const b of breweries) {
      const name = (b.name || "").trim();
      if (!name) continue;
      if (existingNames.has(name.toLowerCase())) continue;

      const postalCode = (b.postal_code || "1000").toString();
      const [baseLat, baseLng] = postalCodeToCoords(postalCode);
      // Small random offset to prevent overlapping markers
      const lat = baseLat + (Math.random() - 0.5) * 0.015;
      const lng = baseLng + (Math.random() - 0.5) * 0.015;

      const province = provinceMap[b.province] || b.province || "Brussels";

      toInsert.push({
        name,
        type: b.type || classifyType(name),
        province,
        lat,
        lng,
        address: b.address || "",
        phone: b.phone || "",
        email: cleanEmail(b.email || ""),
        website_url: cleanWebsite(b.website || ""),
        story: "",
      });

      // Track to avoid duplicate inserts within same batch
      existingNames.add(name.toLowerCase());
    }

    let insertedCount = 0;
    // Insert in batches of 50
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      const { error } = await supabase.from("breweries").insert(batch);
      if (error) {
        console.error(`Batch ${i} error:`, error.message);
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
        skipped: breweries.length - insertedCount,
        total_received: breweries.length,
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
