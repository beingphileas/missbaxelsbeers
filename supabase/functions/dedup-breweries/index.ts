import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function completenessScore(b: Record<string, unknown>): number {
  const fields = [
    "website_url",
    "email",
    "phone",
    "google_url",
    "untappd_url",
    "story",
    "established_year",
    "address",
  ];

  let score = 0;
  for (const field of fields) {
    const value = b[field];
    if (value !== null && value !== undefined && value !== "") score++;
  }

  return score;
}

function mergeFields(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const mergeable = [
    "website_url",
    "email",
    "phone",
    "google_url",
    "untappd_url",
    "story",
    "established_year",
    "address",
  ];

  for (const field of mergeable) {
    if (
      (target[field] === null || target[field] === undefined || target[field] === "") &&
      source[field] !== null &&
      source[field] !== undefined &&
      source[field] !== ""
    ) {
      patch[field] = source[field];
    }
  }

  return patch;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    return new Response(JSON.stringify({ error: "Sessie ongeldig. Log opnieuw in." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Je account heeft geen admin-rechten." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;

    const { data: allBreweries, error } = await supabase
      .from("breweries")
      .select("*")
      .order("name");

    if (error) throw error;

    const groups = new Map<string, any[]>();

    for (const brewery of allBreweries || []) {
      const nameKey = normalizeText(brewery.name);
      const addressKey = normalizeText(brewery.address);

      if (!nameKey || !addressKey) continue;

      const key = `${nameKey}|${addressKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(brewery);
    }

    const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

    const results: Array<{
      name: string;
      address: string;
      kept_id: string;
      removed_ids: string[];
      merged_fields: string[];
      beers_moved: number;
      status: string;
    }> = [];

    let totalRemoved = 0;
    let totalMerged = 0;

    for (const group of duplicateGroups) {
      group.sort((a: any, b: any) => {
        const scoreDiff = completenessScore(b) - completenessScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      const keeper = group[0];
      const duplicates = group.slice(1);
      const duplicateIds = duplicates.map((item: any) => item.id);

      const patch: Record<string, unknown> = {};
      const mergedFields = new Set<string>();

      for (const duplicate of duplicates) {
        const fieldsToMerge = mergeFields(keeper, duplicate);
        for (const [field, value] of Object.entries(fieldsToMerge)) {
          if (!(field in patch)) {
            patch[field] = value;
            mergedFields.add(field);
          }
        }
      }

      let beersMoved = 0;

      if (!dryRun) {
        if (Object.keys(patch).length > 0) {
          const { error: updateKeeperError } = await supabase
            .from("breweries")
            .update(patch)
            .eq("id", keeper.id);

          if (updateKeeperError) throw updateKeeperError;
        }

        for (const duplicateId of duplicateIds) {
          const { data: beers, error: beerSelectError } = await supabase
            .from("beers")
            .select("id")
            .eq("brewery_id", duplicateId);

          if (beerSelectError) throw beerSelectError;

          if (beers && beers.length > 0) {
            const { error: moveBeersError } = await supabase
              .from("beers")
              .update({ brewery_id: keeper.id })
              .eq("brewery_id", duplicateId);

            if (moveBeersError) throw moveBeersError;
            beersMoved += beers.length;
          }

          const { error: moveBlogPostLinksError } = await supabase
            .from("blog_post_breweries")
            .update({ brewery_id: keeper.id })
            .eq("brewery_id", duplicateId);
          if (moveBlogPostLinksError) throw moveBlogPostLinksError;

          const { error: moveBlogPostsError } = await supabase
            .from("blog_posts")
            .update({ brewery_id: keeper.id })
            .eq("brewery_id", duplicateId);
          if (moveBlogPostsError) throw moveBlogPostsError;

          const { error: moveBreweryUsersError } = await supabase
            .from("brewery_users")
            .update({ brewery_id: keeper.id })
            .eq("brewery_id", duplicateId);
          if (moveBreweryUsersError) throw moveBreweryUsersError;

          const { error: movePendingChangesError } = await supabase
            .from("pending_changes")
            .update({ brewery_id: keeper.id })
            .eq("brewery_id", duplicateId);
          if (movePendingChangesError) throw movePendingChangesError;

          const { error: deleteDuplicateError } = await supabase
            .from("breweries")
            .delete()
            .eq("id", duplicateId);
          if (deleteDuplicateError) throw deleteDuplicateError;
        }
      }

      results.push({
        name: keeper.name,
        address: keeper.address,
        kept_id: keeper.id,
        removed_ids: duplicateIds,
        merged_fields: [...mergedFields],
        beers_moved: beersMoved,
        status: dryRun ? "dry_run" : "deduped",
      });

      totalRemoved += duplicateIds.length;
      totalMerged++;
    }

    return new Response(JSON.stringify({
      dry_run: dryRun,
      groups_found: duplicateGroups.length,
      total_removed: dryRun ? 0 : totalRemoved,
      total_merged: totalMerged,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
