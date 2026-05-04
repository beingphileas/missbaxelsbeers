import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BIERSTEKERS_BREWERY_ID = "ef5deaab-5e31-440d-804b-aef8c015ef5c";
const SITEMAP_URL = "https://en.bierstekers.com/store-products-sitemap.xml";

// Skip non-beer products (boxes / packs)
const SKIP_SLUGS = new Set([
  "kies-zelf-uw-pack",
  "24-03-2021-bottle-release-box",
]);

function inferStyleFromSlug(slug: string, name: string, desc: string): string {
  const s = `${slug} ${name} ${desc}`.toLowerCase();
  if (s.includes("kriek")) return "Kriek (Blend)";
  if (s.includes("lmbk") || s.includes("lambic") || s.includes("ode")) return "Lambic Blend";
  if (s.includes("oud bruin") || s.includes("oud-bruin")) return "Flemish Oud Bruin (Blend)";
  if (s.includes("ipa")) return "Sour IPA (Blend)";
  if (s.includes("smoked")) return "Smoked Sour (Blend)";
  if (s.includes("zwart")) return "Dark Sour (Blend)";
  if (s.includes("wit")) return "White Sour (Blend)";
  if (s.includes("zure pater") || s.includes("zure-pater")) return "Sour Tripel (Blend)";
  if (s.includes("zuur") || s.includes("sour")) return "Sour Blend";
  return "Blend";
}

function extractAbv(text: string): number | null {
  // Patterns: "ABV 7.2%", "7,2%", "alc 7%", "alc. 7.0 %"
  const re = /(?:abv|alc\.?)?\s*([0-9]+[.,][0-9]+|[0-9]+)\s*%/i;
  const m = text.match(re);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (!isFinite(n) || n <= 0 || n > 20) return null;
  return n;
}

async function fetchProductUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();
  const urls: string[] = [];
  for (const m of xml.matchAll(/<loc>(https:\/\/en\.bierstekers\.com\/product-page\/[^<]+)<\/loc>/g)) {
    urls.push(m[1]);
  }
  return urls;
}

async function scrapeProduct(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MissBaxelBot/1.0" } });
  const html = await res.text();

  // JSON-LD
  let product: any = null;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        if (d?.["@type"] === "Product") { product = d; break; }
      }
    } catch (_) { /* ignore */ }
    if (product) break;
  }
  if (!product) return null;

  const name: string = (product.name ?? "").trim();
  const description: string = (product.description ?? "").trim();
  let imageUrl: string | null = null;
  if (Array.isArray(product.image) && product.image[0]) {
    const first = product.image[0];
    imageUrl = typeof first === "string" ? first : (first.contentUrl ?? null);
    if (imageUrl) imageUrl = imageUrl.replace(/\/v1\/fit\/w_500,h_500,q_90\//, "/v1/fit/w_900,h_900,q_85/");
  } else if (typeof product.image === "string") {
    imageUrl = product.image;
  }

  return { name, description, imageUrl };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: roleCheck } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const urls = await fetchProductUrls();
    const results: any[] = [];

    for (const url of urls) {
      const slug = url.split("/").pop()!;
      if (SKIP_SLUGS.has(slug)) {
        results.push({ slug, status: "skipped" });
        continue;
      }

      try {
        const product = await scrapeProduct(url);
        if (!product || !product.name) {
          results.push({ slug, status: "no-data" });
          continue;
        }

        const cleanName = product.name
          .replace(/\s*\d+([.,]\d+)?\s*cl\b/gi, "")
          .replace(/\s+-\s+/g, " ")
          .trim();
        const abv = extractAbv(product.description) ?? extractAbv(product.name);
        const style = inferStyleFromSlug(slug, cleanName, product.description);

        // Check if already exists by source_url or name
        const { data: existing } = await supabase
          .from("beers")
          .select("id, name")
          .eq("brewery_id", BIERSTEKERS_BREWERY_ID)
          .ilike("name", cleanName)
          .maybeSingle();

        const payload = {
          brewery_id: BIERSTEKERS_BREWERY_ID,
          name: cleanName,
          style,
          abv,
          description: product.description || null,
          image_url: product.imageUrl,
          source_url: url,
          source: "bierstekers" as const,
          lifecycle_status: "archive",
        };

        if (existing) {
          const { error } = await supabase.from("beers").update(payload).eq("id", existing.id);
          if (error) throw error;
          results.push({ slug, name: cleanName, status: "updated" });
        } else {
          const { error } = await supabase.from("beers").insert(payload);
          if (error) throw error;
          results.push({ slug, name: cleanName, status: "inserted" });
        }
      } catch (e: any) {
        results.push({ slug, status: "error", error: e?.message ?? String(e) });
      }

      // gentle delay
      await new Promise((r) => setTimeout(r, 400));
    }

    const inserted = results.filter((r) => r.status === "inserted").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    return new Response(JSON.stringify({ summary: { total: urls.length, inserted, updated, skipped, errors }, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("import-bierstekers error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
