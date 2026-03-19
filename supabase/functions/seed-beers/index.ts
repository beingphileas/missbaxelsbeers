import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──

async function queryPerplexity(apiKey: string, prompt: string): Promise<{ content: string; citations: string[] }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "You are a Belgian beer database expert. Return ONLY factual, verifiable data about commercially available beers. Never invent beers. If uncertain, say so." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    console.error("Perplexity error:", res.status, await res.text());
    return { content: "", citations: [] };
  }
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content ?? "", citations: data.citations ?? [] };
}

async function queryAI(apiKey: string, system: string, prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    console.error(`AI gateway error: ${status}`, text);
    if (status === 429) throw new Error("Rate limited — probeer later opnieuw");
    if (status === 402) throw new Error("AI credits op — voeg credits toe in Settings > Workspace > Usage");
    throw new Error(`AI gateway error: ${status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Admin check
  const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { brewery_id, mode = "discover" } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── DISCOVER mode: find beers for a specific brewery ──
    if (mode === "discover") {
      if (!brewery_id) throw new Error("brewery_id required");

      const { data: brewery } = await supabase.from("breweries").select("*").eq("id", brewery_id).single();
      if (!brewery) throw new Error("Brewery not found");

      // Get existing beers to avoid duplicates
      const { data: existingBeers } = await supabase.from("beers").select("name").eq("brewery_id", brewery_id);
      const existingNames = new Set((existingBeers ?? []).map((b: any) => b.name.toLowerCase()));

      // Source 1: Perplexity web search
      const perplexityResult = await queryPerplexity(
        PERPLEXITY_API_KEY,
        `List ALL commercially available beers currently brewed by "${brewery.name}" (Belgian brewery${brewery.address ? `, ${brewery.address}` : ""}).
For each beer, provide: exact name, style/type, ABV percentage, and a brief one-line description.
Only include beers confirmed as currently available products. Do NOT include discontinued beers, one-off collaborations, or homebrews.
Return as a structured list.`
      );

      // Source 2: AI cross-validation using the Perplexity data
      const aiValidation = await queryAI(
        LOVABLE_API_KEY,
        "You are a Belgian beer database validator. You receive web search results about a brewery's beer lineup. Your job is to parse and validate this data into clean JSON. NEVER invent beers not mentioned in the source data.",
        `Parse the following web search results about beers from "${brewery.name}" into a JSON array.
Each item: {"name": "exact beer name", "style": "beer style", "abv": number_or_null, "description": "1 line", "confidence": "high|medium|low", "reason": "why this confidence level"}

Rules:
- confidence "high": multiple sources confirm this beer exists with consistent details
- confidence "medium": mentioned in sources but limited detail
- confidence "low": only one vague mention
- NEVER add beers not present in the source data
- If a beer name is ambiguous (could be a variant), note it in reason

Source data:
${perplexityResult.content}

Citations: ${perplexityResult.citations.join(", ")}

Return ONLY a JSON array, no markdown fences.`
      );

      // Parse AI response
      let candidates: any[] = [];
      try {
        const cleaned = aiValidation.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        candidates = JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse AI response:", e, aiValidation.slice(0, 500));
        candidates = [];
      }

      // Filter out existing beers and build source_records
      const newBeers = candidates
        .filter((c: any) => c.name && !existingNames.has(c.name.toLowerCase().trim()))
        .map((c: any) => ({
          name: c.name.trim(),
          style: c.style || "Unknown",
          abv: typeof c.abv === "number" ? c.abv : null,
          description: c.description || null,
          brewery_id,
          brewery_name: brewery.name,
          confidence: c.confidence || "low",
          reason: c.reason || "",
          sources: [
            { source: "perplexity_sonar", fetched_at: new Date().toISOString(), confidence: c.confidence || "low" },
            { source: "lovable_ai_validation", fetched_at: new Date().toISOString(), confidence: c.confidence || "low" },
          ],
          citations: perplexityResult.citations,
        }));

      return new Response(JSON.stringify({
        brewery: { id: brewery.id, name: brewery.name },
        existing_count: existingNames.size,
        candidates: newBeers,
        total_found: candidates.length,
        new_count: newBeers.length,
        citations: perplexityResult.citations,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── COMMIT mode: insert confirmed beers ──
    if (mode === "commit") {
      const { beers } = await req.json();
      if (!Array.isArray(beers) || beers.length === 0) {
        return new Response(JSON.stringify({ error: "No beers to commit" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const beer of beers) {
        if (!beer.name || !beer.brewery_id) { skipped++; continue; }

        const sourceRecords = beer.sources || [
          { source: "perplexity_sonar", fetched_at: new Date().toISOString(), confidence: beer.confidence || "medium" },
          { source: "lovable_ai_validation", fetched_at: new Date().toISOString(), confidence: beer.confidence || "medium" },
        ];

        const verificationScore = beer.confidence === "high" ? 75 : beer.confidence === "medium" ? 50 : 25;

        const { error } = await supabase.from("beers").insert({
          name: beer.name,
          brewery_id: beer.brewery_id,
          style: beer.style || "Unknown",
          abv: beer.abv || null,
          description: beer.description || null,
          source_records: sourceRecords,
          source_count: sourceRecords.length,
          verification_status: "pending",
          verification_score: verificationScore,
        });

        if (error) {
          if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
            skipped++;
          } else {
            console.error("Insert error:", error.message);
            errors.push(`${beer.name}: ${error.message}`);
          }
        } else {
          inserted++;
        }
      }

      return new Response(JSON.stringify({ inserted, skipped, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── VERIFY mode: cross-check existing beers with web sources ──
    if (mode === "verify") {
      if (!brewery_id) throw new Error("brewery_id required");

      const { data: beers } = await supabase
        .from("beers")
        .select("id, name, style, abv, verification_status, source_records, source_count")
        .eq("brewery_id", brewery_id)
        .in("verification_status", ["unverified", "pending"]);

      if (!beers || beers.length === 0) {
        return new Response(JSON.stringify({ verified: 0, message: "No unverified beers" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: brewery } = await supabase.from("breweries").select("name").eq("id", brewery_id).single();
      const breweryName = brewery?.name || "Unknown";

      // Batch verify up to 20 beers at once
      const batch = beers.slice(0, 20);
      const beerList = batch.map((b: any) => `- "${b.name}" (${b.style}, ${b.abv ?? "?"}% ABV)`).join("\n");

      const verifyResult = await queryPerplexity(
        PERPLEXITY_API_KEY,
        "You are a Belgian beer verification expert. For each beer listed, determine if it is a real, currently available commercial product from the specified brewery.",
        `Verify these beers from "${breweryName}":\n${beerList}\n\nFor each beer, state: EXISTS (yes/no), CONFIDENCE (high/medium/low), and any CORRECTIONS (name spelling, style, ABV).`
      );

      // Use AI to parse into structured verification results
      const parsed = await queryAI(
        LOVABLE_API_KEY,
        "Parse beer verification results into JSON. Never invent data.",
        `Parse these verification results into JSON array:
${verifyResult.content}

Format: [{"name": "beer name", "exists": true/false, "confidence": "high/medium/low", "corrections": {"style": "...", "abv": ...} or null, "note": "any notes"}]
Return ONLY JSON array.`
      );

      let verifications: any[] = [];
      try {
        verifications = JSON.parse(parsed.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      } catch { verifications = []; }

      // Update beers
      let verified = 0;
      for (const v of verifications) {
        const beer = batch.find((b: any) => b.name.toLowerCase() === v.name?.toLowerCase());
        if (!beer) continue;

        const currentSources = (beer.source_records as any[]) || [];
        currentSources.push({
          source: "perplexity_verify",
          fetched_at: new Date().toISOString(),
          confidence: v.confidence || "low",
          exists: v.exists,
          corrections: v.corrections,
        });

        const newScore = v.exists
          ? v.confidence === "high" ? 85 : v.confidence === "medium" ? 65 : 40
          : 10;

        const status = v.exists === false
          ? "rejected"
          : v.confidence === "high" ? "verified" : "pending";

        const updates: any = {
          source_records: currentSources,
          source_count: currentSources.length,
          verification_status: status,
          verification_score: newScore,
          verified_at: status === "verified" ? new Date().toISOString() : null,
        };

        // Apply corrections
        if (v.corrections?.style) updates.style = v.corrections.style;
        if (v.corrections?.abv != null) updates.abv = v.corrections.abv;

        await supabase.from("beers").update(updates).eq("id", beer.id);
        verified++;
      }

      return new Response(JSON.stringify({
        verified,
        total: batch.length,
        citations: verifyResult.citations,
        results: verifications,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-beers error:", (err as Error).message);
    const status = (err as Error).message.includes("Rate limited") ? 429
      : (err as Error).message.includes("credits op") ? 402 : 500;
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
