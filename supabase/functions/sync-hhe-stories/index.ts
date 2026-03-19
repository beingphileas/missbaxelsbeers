import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HHE (Hop Heritage Explorer) public credentials
const HHE_URL = "https://shhcdyxvenvynutafdof.supabase.co";
const HHE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaGNkeXh2ZW52eW51dGFmZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzMxNzcsImV4cCI6MjA4OTM0OTE3N30.foi0jaEyTb14vx0CTuuB8qUEQOVv71Zblaj8xssRgac";

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
    const dryRun = body.dry_run !== false;
    const batchSize = body.batch_size ?? 100;
    const offset = body.offset ?? 0;

    // Fetch stories from HHE
    const hhe = createClient(HHE_URL, HHE_ANON_KEY);

    const pageSize = 1000;
    let from = 0;
    const hheBreweries: any[] = [];
    while (true) {
      const { data, error } = await hhe
        .from("breweries")
        .select("name, story")
        .not("story", "is", null)
        .neq("story", "")
        .order("name")
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`HHE query error: ${error.message}`);
      if (!data?.length) break;
      hheBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Fetch local breweries without stories
    from = 0;
    const localBreweries: any[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("breweries")
        .select("id, name, story")
        .order("name")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data?.length) break;
      localBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // Build name->story map from HHE (lowercase for matching)
    const hheMap = new Map<string, string>();
    for (const b of hheBreweries) {
      hheMap.set(b.name.toLowerCase().trim(), b.story);
    }

    // Filter to only those that can be matched and need updating
    const toProcess = localBreweries.filter(local => {
      const key = local.name.toLowerCase().trim();
      const hheStory = hheMap.get(key);
      if (!hheStory) return false;
      if (local.story && local.story.trim() !== "") return false;
      return true;
    });

    // Apply offset + batch_size
    const batch = toProcess.slice(offset, offset + batchSize);
    
    const matches: Array<{ name: string; status: string }> = [];
    let updated = 0;

    for (const local of batch) {
      const key = local.name.toLowerCase().trim();
      const hheStory = hheMap.get(key)!;

      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from("breweries")
          .update({ story: hheStory })
          .eq("id", local.id);
        if (updateErr) {
          matches.push({ name: local.name, status: `error: ${updateErr.message}` });
          continue;
        }
      }

      matches.push({ name: local.name, status: dryRun ? "would_update" : "updated" });
      updated++;
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      hhe_stories_available: hheBreweries.length,
      local_breweries: localBreweries.length,
      matched_and_updated: updated,
      skipped_has_story: skipped,
      matches,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-hhe-stories error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
