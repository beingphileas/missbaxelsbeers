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

  // Auth check
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

  // Verify admin
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
    const { entity_type, entity_id } = await req.json();
    if (!entity_type || !entity_id) {
      return new Response(JSON.stringify({ error: "entity_type and entity_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch entity data based on type
    let entityData: any = null;
    let entityLabel = "";

    if (entity_type === "brewery") {
      const { data, error } = await supabase
        .from("breweries")
        .select("*")
        .eq("id", entity_id)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Brewery not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Also fetch associated beers
      const { data: beers } = await supabase
        .from("beers")
        .select("name, style, abv")
        .eq("brewery_id", entity_id);
      entityData = { ...data, known_beers: beers || [] };
      entityLabel = `Brouwerij "${data.name}"`;
    } else if (entity_type === "beer") {
      const { data, error } = await supabase
        .from("beers")
        .select("*, breweries:brewery_id(name)")
        .eq("id", entity_id)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Beer not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      entityData = data;
      entityLabel = `Bier "${data.name}" van ${(data as any).breweries?.name || "onbekend"}`;
    } else if (entity_type === "venue") {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", entity_id)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Venue not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      entityData = data;
      entityLabel = `Venue "${data.name}"`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid entity_type. Use: brewery, beer, venue" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build fact-check prompt based on entity type
    const entityJson = JSON.stringify(entityData, null, 2);

    const systemPrompt = `Je bent een Belgische bier-expert en fact-checker. Je controleert data over Belgische brouwerijen, bieren en biervenues op correctheid.

Je taak:
1. Controleer ALLE velden op feitelijke juistheid (namen, locaties, stijlen, ABV, adressen, etc.)
2. Markeer fouten, verdachte data en ontbrekende informatie
3. Geef een betrouwbaarheidsscore (0-100)
4. Doe concrete suggesties voor verbeteringen

Wees streng maar eerlijk. Als iets niet te verifiëren is, zeg dat dan.
Antwoord ALTIJD in het Nederlands.`;

    let userPrompt = "";
    if (entity_type === "brewery") {
      userPrompt = `Fact-check deze Belgische brouwerij:\n\n${entityJson}\n\nControleer specifiek:
- Klopt de naam en spelling?
- Klopt het adres en de provincie?
- Klopt het type (microbrouwerij, abdijbrouwerij, etc.)?
- Klopt het oprichtingsjaar?
- Is de website URL correct?
- Kloppen de coördinaten (lat/lng) voor België?
- Zijn de gekoppelde bieren correct voor deze brouwerij?`;
    } else if (entity_type === "beer") {
      userPrompt = `Fact-check dit Belgisch bier:\n\n${entityJson}\n\nControleer specifiek:
- Klopt de naam en spelling?
- Klopt de bierstijl?
- Klopt het alcoholpercentage (ABV)?
- Hoort dit bier bij de aangegeven brouwerij?
- Klopt de beschrijving?
- Zijn er bekende flavor profiles of food pairings die ontbreken?`;
    } else if (entity_type === "venue") {
      userPrompt = `Fact-check deze Belgische bierlocatie:\n\n${entityJson}\n\nControleer specifiek:
- Klopt de naam en spelling?
- Klopt het adres en de provincie?
- Klopt het type venue?
- Kloppen de ratings (Google, TripAdvisor, Untappd)?
- Is de website URL correct?
- Kloppen de coördinaten voor België?
- Bestaat deze zaak nog?`;
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fact_check_result",
              description: "Return the fact-check results",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "number",
                    description: "Betrouwbaarheidsscore 0-100",
                  },
                  verdict: {
                    type: "string",
                    enum: ["correct", "deels_correct", "verdacht", "fout"],
                    description: "Algemeen oordeel",
                  },
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", description: "Veldnaam" },
                        severity: { type: "string", enum: ["info", "warning", "error"] },
                        message: { type: "string", description: "Beschrijving van het probleem" },
                        suggestion: { type: "string", description: "Suggestie voor verbetering" },
                      },
                      required: ["field", "severity", "message"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "string",
                    description: "Korte samenvatting van de fact-check in het Nederlands",
                  },
                },
                required: ["score", "verdict", "issues", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "fact_check_result" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer later opnieuw" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits op" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI fact-check failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let result = { score: 0, verdict: "fout", issues: [], summary: "Kon niet verwerken" };
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse fact-check result:", e);
      }
    }

    console.log(`Fact-check ${entityLabel}: score=${result.score}, verdict=${result.verdict}, issues=${(result.issues as any[]).length}`);

    return new Response(
      JSON.stringify({
        entity_type,
        entity_id,
        entity_label: entityLabel,
        ...result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Fact-check error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
