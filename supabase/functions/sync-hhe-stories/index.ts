import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HHE (Hop Heritage Explorer) public credentials
const HHE_URL = "https://shhcdyxvenvynutafdof.supabase.co";
const HHE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaGNkeXh2ZW52eW51dGFmZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzMxNzcsImV4cCI6MjA4OTM0OTE3N30.foi0jaEyTb14vx0CTuuB8qUEQOVv71Zblaj8xssRgac";

// All brewery fields to sync (shared between both databases)
const SYNC_FIELDS = [
  "name", "type", "province", "lat", "lng", "address", "phone", "email",
  "website_url", "established_year", "story", "featured", "google_rating",
  "google_review_count", "google_url", "untappd_rating", "untappd_review_count",
  "untappd_url", "rating_weight",
  // Extra HHE fields (last_scraped_at is excluded — it tracks local beer import status)
  "brewery_category", "code", "company_number", "facebook_url", "is_brewsite",
  "municipality", "official_name", "phone2", "story_ai_generated",
];

const HHE_SELECT = SYNC_FIELDS.join(", ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Niet ingelogd." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Sessie ongeldig." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin check
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Geen admin-rechten." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size ?? 200;
    const offset = body.offset ?? 0;

    // Fetch ALL breweries from HHE (paginated)
    const hhe = createClient(HHE_URL, HHE_ANON_KEY);
    const pageSize = 1000;
    let from = 0;
    const hheBreweries: any[] = [];
    while (true) {
      const { data, error } = await hhe
        .from("breweries")
        .select(HHE_SELECT)
        .order("name")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`HHE query error: ${error.message}`);
      if (!data?.length) break;
      hheBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Build name -> HHE data map
    const hheMap = new Map<string, any>();
    for (const b of hheBreweries) {
      hheMap.set(b.name.toLowerCase().trim(), b);
    }

    // Fetch local breweries (paginated)
    from = 0;
    const localBreweries: any[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("breweries")
        .select("id, name")
        .order("name")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data?.length) break;
      localBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Build local name -> id map
    const localMap = new Map<string, string>();
    for (const b of localBreweries) {
      localMap.set(b.name.toLowerCase().trim(), b.id);
    }

    // 1) Update existing breweries with HHE data
    const existingToUpdate = localBreweries
      .filter(local => hheMap.has(local.name.toLowerCase().trim()));

    const batch = existingToUpdate.slice(offset, offset + batchSize);
    let updated = 0;
    let inserted = 0;
    let errors = 0;
    const log: Array<{ name: string; action: string }> = [];

    for (const local of batch) {
      const key = local.name.toLowerCase().trim();
      const hheData = hheMap.get(key)!;
      
      // Build update payload (all fields from HHE)
      const payload: Record<string, any> = {};
      for (const field of SYNC_FIELDS) {
        if (hheData[field] !== undefined) {
          payload[field] = hheData[field];
        }
      }

      const { error: updateErr } = await supabase
        .from("breweries")
        .update(payload)
        .eq("id", local.id);

      if (updateErr) {
        log.push({ name: local.name, action: `error: ${updateErr.message}` });
        errors++;
      } else {
        log.push({ name: local.name, action: "updated" });
        updated++;
      }
    }

    // 2) Insert HHE breweries that don't exist locally (only in first batch call)
    if (offset === 0) {
      const newBreweries = hheBreweries.filter(
        hb => !localMap.has(hb.name.toLowerCase().trim())
      );

      for (const hb of newBreweries) {
        const payload: Record<string, any> = {};
        for (const field of SYNC_FIELDS) {
          if (hb[field] !== undefined) {
            payload[field] = hb[field];
          }
        }

        const { error: insertErr } = await supabase
          .from("breweries")
          .insert(payload);

        if (insertErr) {
          log.push({ name: hb.name, action: `insert_error: ${insertErr.message}` });
          errors++;
        } else {
          log.push({ name: hb.name, action: "inserted" });
          inserted++;
        }
      }
    }

    return new Response(JSON.stringify({
      hhe_total: hheBreweries.length,
      local_total: localBreweries.length,
      updated,
      inserted,
      errors,
      batch_offset: offset,
      batch_size: batchSize,
      has_more: offset + batchSize < existingToUpdate.length,
      next_offset: offset + batchSize,
      log,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-hhe error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
