import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Two modes:
 *  1. "preview" — returns fuzzy-matched brewery suggestions for each beer (no DB writes)
 *  2. "commit"  — inserts confirmed beers with their chosen brewery_id
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify user is admin
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify admin role
  const { data: roleCheck } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { beers, mode = "preview" } = await req.json();

    if (!Array.isArray(beers) || beers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No beers provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "preview") {
      // For each beer, find fuzzy-matched breweries
      const results = [];

      for (const beer of beers) {
        const breweryName = (beer.brewery || beer.brouwerij || beer.brewery_name || "").trim();
        let matches: any[] = [];

        if (breweryName) {
          const { data } = await supabase.rpc("fuzzy_match_brewery", {
            search_name: breweryName,
          });
          matches = (data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            similarity: Math.round(m.similarity * 100),
          }));
        }

        results.push({
          name: (beer.name || beer.naam || "").trim(),
          style: (beer.style || beer.stijl || beer.type || "").trim(),
          abv: parseFloat(beer.abv || beer.alcoholpercentage || beer.alcohol || "0") || null,
          description: (beer.description || beer.beschrijving || "").trim(),
          source_url: (beer.source_url || beer.url || "").trim(),
          image_url: (beer.image_url || beer.afbeelding || "").trim(),
          brewery_input: breweryName,
          brewery_matches: matches,
          brewery_id: matches.length > 0 ? matches[0].id : null,
        });
      }

      return new Response(JSON.stringify({ preview: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "commit") {
      // beers should have brewery_id already assigned from the preview step
      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < beers.length; i += 50) {
        const batch = beers.slice(i, i + 50).filter((b: any) => b.name && b.brewery_id);

        if (batch.length === 0) {
          skipped += beers.slice(i, i + 50).length;
          continue;
        }

        const rows = batch.map((b: any) => ({
          name: b.name,
          brewery_id: b.brewery_id,
          style: b.style || "Unknown",
          abv: b.abv || null,
          description: b.description || null,
          source_url: b.source_url || null,
          image_url: b.image_url || null,
        }));

        const { error } = await supabase.from("beers").insert(rows);
        if (error) {
          console.error(`Insert batch error:`, error.message);
          errors.push(error.message);
        } else {
          inserted += rows.length;
        }
        skipped += beers.slice(i, i + 50).length - batch.length;
      }

      return new Response(
        JSON.stringify({ inserted, skipped, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown mode: ${mode}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
