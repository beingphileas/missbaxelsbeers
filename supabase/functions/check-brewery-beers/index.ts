import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

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
    const { brewery_id } = await req.json();
    if (!brewery_id) {
      return new Response(JSON.stringify({ error: "brewery_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch brewery
    const { data: brewery, error: bErr } = await supabase
      .from("breweries")
      .select("id, name")
      .eq("id", brewery_id)
      .single();
    if (bErr || !brewery) {
      return new Response(JSON.stringify({ error: "Brewery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all beers for this brewery
    const { data: beers, error: beersErr } = await supabase
      .from("beers")
      .select("id, name, style, abv, description")
      .eq("brewery_id", brewery_id)
      .order("name");

    if (beersErr) {
      return new Response(JSON.stringify({ error: beersErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!beers || beers.length === 0) {
      return new Response(
        JSON.stringify({
          brewery_name: brewery.name,
          beer_count: 0,
          duplicates: [],
          issues: [],
          summary: "Geen bieren gevonden voor deze brouwerij.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build beer list for AI
    const beerList = beers
      .map((b, i) => `${i + 1}. [${b.id}] "${b.name}" — stijl: ${b.style || "?"}, ABV: ${b.abv ?? "?"}, beschrijving: ${b.description?.substring(0, 100) || "geen"}`)
      .join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Je bent een Belgische bier-expert en data quality specialist. Je analyseert de bierenlijst van brouwerij "${brewery.name}" op:

1. **DUPLICATEN**: Zoek bieren die hetzelfde bier zijn maar anders geschreven, inclusief:
   - Letterlijke vertalingen (NL↔FR↔EN, bv. "Blond" vs "Blonde", "Tripel" vs "Triple", "Wit" vs "Blanche")
   - Spelling-varianten (bv. met/zonder accent, hoofdletters)
   - Naam + formaat-varianten (bv. "Tripel 33cl" en "Tripel" zijn hetzelfde bier)
   - Hetzelfde bier met brouwerijnaam als prefix/suffix
   
2. **DATA-ISSUES**: Controleer per bier:
   - Ontbrekende of verdachte stijl
   - Onrealistisch ABV (< 0.5% of > 25%)
   - Lege/onzinnige beschrijving
   - Is het eigenlijk een bier? (geen merchandise, glas, pakket)

Groepeer duplicaten zodat duidelijk is welke bij elkaar horen en welke de "beste" versie is (meeste info).`,
          },
          {
            role: "user",
            content: `Analyseer deze ${beers.length} bieren van "${brewery.name}":\n\n${beerList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "beer_check_result",
              description: "Return duplicate groups and data issues",
              parameters: {
                type: "object",
                properties: {
                  duplicates: {
                    type: "array",
                    description: "Groups of duplicate beers",
                    items: {
                      type: "object",
                      properties: {
                        keep_id: { type: "string", description: "ID of the best version to keep" },
                        keep_name: { type: "string", description: "Name of the beer to keep" },
                        remove_ids: {
                          type: "array",
                          items: { type: "string" },
                          description: "IDs of duplicates to remove",
                        },
                        remove_names: {
                          type: "array",
                          items: { type: "string" },
                          description: "Names of duplicates to remove",
                        },
                        reason: { type: "string", description: "Why these are duplicates" },
                      },
                      required: ["keep_id", "keep_name", "remove_ids", "remove_names", "reason"],
                      additionalProperties: false,
                    },
                  },
                  issues: {
                    type: "array",
                    description: "Data quality issues per beer",
                    items: {
                      type: "object",
                      properties: {
                        beer_id: { type: "string" },
                        beer_name: { type: "string" },
                        severity: { type: "string", enum: ["info", "warning", "error"] },
                        message: { type: "string" },
                      },
                      required: ["beer_id", "beer_name", "severity", "message"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Korte samenvatting in het Nederlands" },
                },
                required: ["duplicates", "issues", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "beer_check_result" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits op" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI check failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let result = { duplicates: [], issues: [], summary: "Kon niet verwerken" };
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Parse error:", e);
      }
    }

    console.log(`Beer check for ${brewery.name}: ${beers.length} beers, ${(result.duplicates as any[]).length} duplicate groups, ${(result.issues as any[]).length} issues`);

    return new Response(
      JSON.stringify({
        brewery_name: brewery.name,
        beer_count: beers.length,
        ...result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Check error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
