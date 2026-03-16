import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch context from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const [{ data: breweries }, { data: beers }, { data: posts }] = await Promise.all([
      sb.from("breweries").select("id, name, type, province, story, established_year").order("name"),
      sb.from("beers").select("id, name, style, abv, flavor_profile, food_pairing, is_hidden_gem, brewery_id").order("name"),
      sb.from("blog_posts").select("id, title, slug, excerpt, tags, brewery_id, beer_id").eq("status", "published").order("published_at", { ascending: false }).limit(20),
    ]);

    // Build brewery name map for beers
    const breweryMap: Record<string, string> = {};
    (breweries ?? []).forEach((b: any) => { breweryMap[b.id] = b.name; });

    const beerContext = (beers ?? []).map((b: any) =>
      `- ${b.name} (${b.style}, ${b.abv}% ABV) by ${breweryMap[b.brewery_id] || "unknown"} — flavors: ${(b.flavor_profile || []).join(", ")}${b.is_hidden_gem ? " ⭐ Hidden Gem" : ""}${b.food_pairing ? ` | food: ${b.food_pairing}` : ""}`
    ).join("\n");

    const breweryContext = (breweries ?? []).map((b: any) =>
      `- ${b.name} (${b.type}, ${b.province})${b.established_year ? ` est. ${b.established_year}` : ""}${b.story ? ` — "${b.story.slice(0, 120)}..."` : ""}`
    ).join("\n");

    const blogContext = (posts ?? []).map((p: any) =>
      `- "${p.title}" [/post/${p.slug}] — ${p.excerpt?.slice(0, 100) || ""} tags: ${(p.tags || []).join(", ")}`
    ).join("\n");

    const systemPrompt = `You are "The Belgian Beer Whisperer" — a knowledgeable, warm, and slightly poetic expert on Belgian beers, breweries, and craft beer culture. You help people discover the perfect Belgian beer.

Your knowledge base (real data from our database):

BREWERIES:
${breweryContext}

BEERS:
${beerContext}

RECENT STORIES:
${blogContext}

RULES:
- Answer in the same language as the user's query (Dutch or English)
- Be concise but evocative — max 3-4 sentences per recommendation
- When recommending beers, always mention the brewery, style, ABV, and why it's special
- If a blog post exists about the beer/brewery, mention it and include the link as [Title](/post/slug)
- If asked about food pairings, use the actual food_pairing data
- Mark hidden gems with ⭐
- If you can't find something in the database, say so honestly
- Use beer emoji sparingly 🍺
- Never invent data not in your knowledge base`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Even geduld — te veel verzoeken. Probeer het zo opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits zijn op. Neem contact op met de beheerder." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI is momenteel niet beschikbaar." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-whisperer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
