import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Belgian postal code ranges → province + approximate center coords
function postalToProvince(pc: number): { province: string; lat: number; lng: number } {
  const map: [number, number, string, number, number][] = [
    [1000, 1299, "Brussels", 50.8503, 4.3517],
    [1300, 1499, "Walloon Brabant", 50.67, 4.62],
    [1500, 1999, "Flemish Brabant", 50.87, 4.35],
    [2000, 2999, "Antwerp", 51.22, 4.40],
    [3000, 3499, "Flemish Brabant", 50.88, 4.70],
    [3500, 3999, "Limburg", 50.93, 5.34],
    [4000, 4999, "Liège", 50.63, 5.57],
    [5000, 5999, "Namur", 50.47, 4.87],
    [6000, 6599, "Hainaut", 50.41, 4.44],
    [6600, 6999, "Luxembourg", 49.93, 5.40],
    [7000, 7999, "Hainaut", 50.45, 3.85],
    [8000, 8999, "West Flanders", 51.05, 3.10],
    [9000, 9999, "East Flanders", 51.05, 3.73],
  ];
  for (const [lo, hi, prov, lat, lng] of map) {
    if (pc >= lo && pc <= hi) return { province: prov, lat, lng };
  }
  return { province: "Brussels", lat: 50.85, lng: 4.35 };
}

// More precise postal code coordinates (first 2 digits)
const preciseCoords: Record<number, [number, number]> = {
  10: [50.8503, 4.3517], 11: [50.8467, 4.3525], 12: [50.8200, 4.3800],
  13: [50.6667, 4.6167], 14: [50.7167, 4.4833], 15: [50.7333, 4.2333],
  16: [50.8833, 4.2500], 17: [50.7500, 4.3500], 18: [50.9167, 4.4333],
  19: [50.8667, 4.4500], 20: [51.2194, 4.4025], 21: [51.2100, 4.4200],
  22: [51.1667, 4.8333], 23: [51.3167, 4.9500], 24: [51.2000, 5.1000],
  25: [51.1333, 4.5667], 26: [51.1500, 4.4333], 27: [51.0500, 4.4833],
  28: [51.0667, 4.5000], 29: [51.2500, 4.4667], 30: [50.8794, 4.7005],
  31: [50.9500, 4.7000], 32: [50.8667, 4.8333], 33: [50.7833, 4.9333],
  34: [50.7500, 5.0833], 35: [50.9308, 5.3325], 36: [50.9667, 5.5000],
  37: [50.7833, 5.4500], 38: [50.8167, 5.1667], 39: [51.1500, 5.6000],
  40: [50.6326, 5.5674], 41: [50.5833, 5.4167], 42: [50.5833, 5.4167],
  43: [50.6833, 5.2333], 44: [50.6500, 5.5000], 45: [50.6333, 5.5000],
  46: [50.7333, 5.7000], 47: [50.4500, 6.0000], 48: [50.5833, 5.8667],
  49: [50.4833, 5.8667], 50: [50.4637, 4.8675], 51: [50.4500, 4.8000],
  52: [50.4000, 4.7500], 53: [50.3000, 5.0833], 54: [50.4000, 5.0000],
  55: [50.2500, 5.0000], 56: [50.3333, 4.8667], 57: [50.1333, 4.5833],
  58: [50.0833, 4.5000], 59: [50.0500, 4.5000], 60: [50.4107, 4.4444],
  61: [50.4500, 4.5000], 62: [50.4167, 4.3333], 63: [50.3000, 4.4167],
  64: [50.0500, 4.3167], 65: [50.0167, 4.5833], 66: [49.9333, 5.4167],
  67: [49.8500, 5.3500], 68: [49.6833, 5.5500], 69: [50.2333, 5.3500],
  70: [50.4550, 3.9560], 71: [50.4667, 4.1833], 72: [50.5000, 4.1000],
  73: [50.4500, 3.8333], 74: [50.6000, 3.5000], 75: [50.6000, 3.3833],
  76: [50.5000, 3.6000], 77: [50.6333, 3.7833], 78: [50.6833, 3.8333],
  79: [50.6000, 3.5833], 80: [51.2093, 3.2247], 81: [51.1833, 3.2000],
  82: [51.0833, 3.1000], 83: [51.1333, 3.0500], 84: [51.2000, 2.9333],
  85: [50.8500, 3.2500], 86: [50.8500, 2.8833], 87: [50.9000, 3.2167],
  88: [50.9333, 3.1167], 89: [50.8500, 2.8833], 90: [51.0536, 3.7253],
  91: [51.0833, 3.9333], 92: [51.0167, 4.1000], 93: [50.9333, 4.0333],
  94: [50.8500, 3.9500], 95: [50.8667, 3.8833], 96: [50.8333, 3.6000],
  97: [50.8500, 3.6000], 98: [51.0000, 3.5333], 99: [51.1833, 3.5333],
};

function extractPostalCode(address: string): number | null {
  const match = address.match(/\b(\d{4})\b/);
  if (!match) return null;
  const pc = parseInt(match[1]);
  if (pc >= 1000 && pc <= 9999) return pc;
  return null;
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all breweries with addresses
    const { data: breweries, error } = await supabase
      .from("breweries")
      .select("id, name, address, province, lat, lng")
      .not("address", "is", null)
      .neq("address", "");

    if (error) throw error;

    let fixed = 0;
    let provinceFixed = 0;
    const issues: string[] = [];

    for (const b of breweries || []) {
      const pc = extractPostalCode(b.address);
      if (!pc) continue;

      const expected = postalToProvince(pc);
      const prefix = Math.floor(pc / 100);
      const coords = preciseCoords[prefix];

      const updates: Record<string, any> = {};

      // Fix province if wrong
      if (b.province !== expected.province) {
        updates.province = expected.province;
        issues.push(`${b.name}: province ${b.province} → ${expected.province} (PC ${pc})`);
        provinceFixed++;
      }

      // Fix coordinates if they seem wrong (more than ~30km from expected)
      if (coords) {
        const dLat = Math.abs(b.lat - coords[0]);
        const dLng = Math.abs(b.lng - coords[1]);
        // If more than ~0.3 degrees off (~30km), fix it
        if (dLat > 0.3 || dLng > 0.5) {
          // Add small random offset to prevent exact overlaps
          updates.lat = coords[0] + (Math.random() - 0.5) * 0.02;
          updates.lng = coords[1] + (Math.random() - 0.5) * 0.02;
          issues.push(`${b.name}: coords (${b.lat.toFixed(2)},${b.lng.toFixed(2)}) → (~${coords[0].toFixed(2)},~${coords[1].toFixed(2)}) (PC ${pc})`);
          fixed++;
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: uErr } = await supabase
          .from("breweries")
          .update(updates)
          .eq("id", b.id);
        if (uErr) {
          issues.push(`ERROR updating ${b.name}: ${uErr.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ coordsFixed: fixed, provincesFixed: provinceFixed, issues }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
