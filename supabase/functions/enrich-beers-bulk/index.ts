// Bulk-enrich existing beers: for each beer missing fields, search Untappd and fill gaps.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_V2 = 'https://api.firecrawl.dev/v2';

const beerSchema = {
  type: 'object',
  properties: {
    style: { type: 'string' },
    abv: { type: 'number' },
    ibu: { type: 'number' },
    description: { type: 'string' },
    image_url: { type: 'string' },
    brewed_at: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) return json({ error: 'FIRECRAWL_API_KEY ontbreekt' }, 500);

    const body = await req.json().catch(() => ({}));
    const onlyMissing: boolean = body?.onlyMissing !== false; // default true
    const limit: number = Math.min(Math.max(Number(body?.limit) || 10, 1), 50);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: brewery } = await supabase
      .from('breweries')
      .select('id')
      .eq('name', "MissBaxel's Beers")
      .maybeSingle();
    if (!brewery) return json({ error: "Hoofd-brouwerij niet gevonden" }, 500);

    let q = supabase.from('beers').select('id, name, style, abv, description, image_url, brewed_at')
      .eq('brewery_id', brewery.id)
      .limit(limit);
    if (onlyMissing) {
      q = q.or('description.is.null,image_url.is.null,brewed_at.is.null,abv.is.null');
    }
    const { data: beers, error: listErr } = await q;
    if (listErr) return json({ error: listErr.message }, 500);

    const results: Array<Record<string, unknown>> = [];
    for (const beer of beers ?? []) {
      try {
        // search
        const sResp = await fetch(`${FIRECRAWL_V2}/search`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: `site:untappd.com ${beer.name}`, limit: 3 }),
        });
        const sData = await sResp.json().catch(() => null);
        const sResults: Array<{ url?: string }> =
          sData?.data?.web ?? sData?.web ?? sData?.data ?? [];
        const url = sResults
          .map((r) => r.url)
          .filter((u): u is string => typeof u === 'string')
          .find((u) => /untappd\.com\/b/i.test(u));

        if (!url) {
          results.push({ id: beer.id, name: beer.name, status: 'no-url' });
          continue;
        }

        // scrape
        const fcResp = await fetch(`${FIRECRAWL_V2}/scrape`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            onlyMainContent: true,
            formats: [
              {
                type: 'json',
                schema: beerSchema,
                prompt:
                  'Extract beer info: style, abv (number), ibu, description (story/flavor), image_url, brewed_at (brewery name only).',
              },
            ],
          }),
        });
        const fcData = await fcResp.json().catch(() => null);
        const ext = fcData?.data?.json ?? fcData?.json ?? null;

        if (!ext) {
          results.push({ id: beer.id, name: beer.name, status: 'no-data' });
          continue;
        }

        // only fill missing fields
        const patch: Record<string, unknown> = { source_url: url };
        if (!beer.style && ext.style) patch.style = String(ext.style);
        if (beer.abv == null && ext.abv) patch.abv = Number(ext.abv) || null;
        if (!beer.description && ext.description) patch.description = String(ext.description);
        if (!beer.image_url && ext.image_url) patch.image_url = String(ext.image_url);
        if (!beer.brewed_at && ext.brewed_at) patch.brewed_at = String(ext.brewed_at);

        const { error: upErr } = await supabase.from('beers').update(patch).eq('id', beer.id);
        if (upErr) {
          results.push({ id: beer.id, name: beer.name, status: 'error', error: upErr.message });
        } else {
          results.push({ id: beer.id, name: beer.name, status: 'updated', filled: Object.keys(patch).filter(k => k !== 'source_url') });
        }

        // throttle to be nice to Firecrawl
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        results.push({ id: beer.id, name: beer.name, status: 'error', error: (e as Error).message });
      }
    }

    return json({ success: true, processed: results.length, results });
  } catch (e) {
    console.error('enrich-beers-bulk error', e);
    return json({ error: (e as Error).message ?? 'Onbekende fout' }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
