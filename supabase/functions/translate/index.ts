import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target_lang } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: "texts array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!target_lang || !["en", "fr"].includes(target_lang)) {
      return new Response(JSON.stringify({ error: "target_lang must be 'en' or 'fr'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langName = target_lang === "en" ? "English" : "French";

    // Build numbered list for precise mapping
    const numberedTexts = texts.map((t: string, i: number) => `[${i}] ${t}`).join("\n");

    const systemPrompt = `You are a professional translator for a Belgian beer website. Translate the following Dutch texts to ${langName}. 

RULES:
- Keep proper nouns (brewery names, beer names, place names) unchanged
- Keep technical terms like ABV, IPA, etc. unchanged
- Keep emoji unchanged
- Maintain the same tone and style
- For beer/brewing terminology, use the standard ${langName} terms
- Return ONLY a JSON object mapping the index number to the translated text
- Example output: {"0": "translated text 0", "1": "translated text 1"}
- Do NOT add any explanation or markdown, just the JSON object`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: numberedTexts },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken. Probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits zijn op." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI translation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let parsed: Record<string, string>;
    try {
      const jsonStr = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse translation response:", content);
      throw new Error("Failed to parse translations");
    }

    // Build result mapping original text -> translated text
    const translations: Record<string, string> = {};
    texts.forEach((original: string, i: number) => {
      translations[original] = parsed[String(i)] || original;
    });

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
