import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HHE_URL = "https://shhcdyxvenvynutafdof.supabase.co";
const HHE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaGNkeXh2ZW52eW51dGFmZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzMxNzcsImV4cCI6MjA4OTM0OTE3N30.foi0jaEyTb14vx0CTuuB8qUEQOVv71Zblaj8xssRgac";

const SYNC_FIELDS = [
  "name", "type", "province", "lat", "lng", "address", "phone", "email",
  "website_url", "established_year", "story", "featured", "google_rating",
  "google_review_count", "google_url", "untappd_rating", "untappd_review_count",
  "untappd_url", "rating_weight",
  "brewery_category", "code", "company_number", "facebook_url", "is_brewsite",
  "municipality", "official_name", "phone2", "story_ai_generated",
];

const HHE_SELECT = SYNC_FIELDS.join(", ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Niet ingelogd." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Sessie ongeldig." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: roleData } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Geen admin-rechten." }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "preview"; // "preview" or "commit"

    // Fetch ALL HHE breweries
    const hhe = createClient(HHE_URL, HHE_ANON_KEY);
    const pageSize = 1000;
    let from = 0;
    const hheBreweries: any[] = [];
    while (true) {
      const { data, error } = await hhe.from("breweries")
        .select(HHE_SELECT).order("name").range(from, from + pageSize - 1);
      if (error) throw new Error(`HHE query error: ${error.message}`);
      if (!data?.length) break;
      hheBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Fetch local breweries
    from = 0;
    const localBreweries: any[] = [];
    while (true) {
      const { data, error } = await supabase.from("breweries")
        .select(`id, ${HHE_SELECT}`).order("name").range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data?.length) break;
      localBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const localMap = new Map<string, any>();
    for (const b of localBreweries) {
      localMap.set(b.name.toLowerCase().trim(), b);
    }

    if (mode === "preview") {
      // Build diff: for each HHE brewery, show changed fields
      const changes: any[] = [];

      for (const hb of hheBreweries) {
        const key = hb.name.toLowerCase().trim();
        const local = localMap.get(key);

        if (local) {
          // Find changed fields
          const diffs: Record<string, { old: any; new: any }> = {};
          for (const field of SYNC_FIELDS) {
            const hVal = hb[field] ?? null;
            const lVal = local[field] ?? null;
            // Compare as strings for simplicity (handles numbers/booleans)
            if (JSON.stringify(hVal) !== JSON.stringify(lVal)) {
              diffs[field] = { old: lVal, new: hVal };
            }
          }
          if (Object.keys(diffs).length > 0) {
            changes.push({
              action: "update",
              local_id: local.id,
              name: hb.name,
              diffs,
            });
          }
        } else {
          // New brewery
          const fields: Record<string, any> = {};
          for (const f of SYNC_FIELDS) {
            if (hb[f] !== undefined) fields[f] = hb[f];
          }
          changes.push({
            action: "insert",
            name: hb.name,
            fields,
          });
        }
      }

      return new Response(JSON.stringify({
        mode: "preview",
        hhe_total: hheBreweries.length,
        local_total: localBreweries.length,
        changes,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "commit") {
      // body.approved is an array of approved change objects
      const approved: any[] = body.approved ?? [];
      let updated = 0, inserted = 0, errors = 0;

      for (const item of approved) {
        if (item.action === "update" && item.local_id) {
          // Only apply the specific fields the admin approved
          const payload: Record<string, any> = {};
          for (const field of (item.approved_fields ?? [])) {
            if (item.diffs?.[field]?.new !== undefined) {
              payload[field] = item.diffs[field].new;
            }
          }
          if (Object.keys(payload).length === 0) continue;

          const { error } = await supabase.from("breweries")
            .update(payload).eq("id", item.local_id);
          if (error) { errors++; } else { updated++; }
        } else if (item.action === "insert") {
          const payload: Record<string, any> = {};
          for (const field of SYNC_FIELDS) {
            if (item.fields?.[field] !== undefined) payload[field] = item.fields[field];
          }
          const { error } = await supabase.from("breweries").insert(payload);
          if (error) { errors++; } else { inserted++; }
        }
      }

      return new Response(JSON.stringify({
        mode: "commit", updated, inserted, errors,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-hhe error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
