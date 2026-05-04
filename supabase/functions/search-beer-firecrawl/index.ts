// Search a beer by name (auto-find Untappd page) via Firecrawl /search,
// then scrape the top result and upsert into `beers`.
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
    name: { type: 'string' },
    style: { type: 'string' },
    abv: { type: 'number' },
    ibu: { type: 'number' },
    description: { type: 'string' },
    image_url: { type: 'string' },
    brewed_at: {
      type: 'string',
      description: 'Brewery that actually brews this beer / collab partner',
    },
  },
  required: ['name', 'style'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return json({ error: 'FIRECRAWL_API_KEY niet geconfigureerd' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!query) return json({ error: 'Geef een biernaam op' }, 400);

    // 1) Find a likely Untappd URL via Firecrawl search
    const searchResp = await fetch(`${FIRECRAWL_V2}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:untappd.com ${query}`,
        limit: 5,
      }),
    });

    const searchData = await searchResp.json().catch(() => null);
    if (!searchResp.ok) {
      console.error('Firecrawl search error', searchResp.status, searchData);
      return json({ error: 'Firecrawl search mislukt' }, 502);
    }

    const results: Array<{ url?: string; title?: string }> =
      searchData?.data?.web ?? searchData?.web ?? searchData?.data ?? [];

    const beerUrl = results
      .map((r) => r.url)
      .filter((u): u is string => typeof u === 'string')
      .find((u) => /untappd\.com\/b(eer)?\//i.test(u) || /untappd\.com\/.+\/\d+/.test(u));

    if (!beerUrl) {
      return json(
        {
          error: 'Geen Untappd-bierpagina gevonden voor deze naam',
          tried: results.map((r) => r.url).filter(Boolean),
        },
        404,
      );
    }

    // 2) Scrape the found page with JSON extraction
    const fcResp = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: beerUrl,
        onlyMainContent: true,
        formats: [
          {
            type: 'json',
            schema: beerSchema,
            prompt:
              'Extract beer info: name, style, abv (number %), ibu (number, optional), description (story / flavor), image_url (label), brewed_at (brewery name only that actually brews this beer).',
          },
        ],
      }),
    });

    const fcData = await fcResp.json().catch(() => null);
    if (!fcResp.ok) {
      return json({ error: `Scrape mislukt (${fcResp.status})` }, 502);
    }

    const extracted =
      fcData?.data?.json ?? fcData?.json ?? fcData?.data?.extract ?? null;

    if (!extracted?.name) {
      return json({ error: 'Geen bruikbare bierdata gevonden', raw: extracted }, 422);
    }

    // 3) Upsert
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: brewery } = await supabase
      .from('breweries')
      .select('id')
      .eq('name', "MissBaxel's Beers")
      .maybeSingle();

    if (!brewery) {
      return json({ error: "Hoofd-brouwerij niet gevonden" }, 500);
    }

    const name = String(extracted.name).trim();
    const payload: Record<string, unknown> = {
      brewery_id: brewery.id,
      name,
      style: String(extracted.style ?? 'Onbekend').trim(),
      abv: extracted.abv ? Number(extracted.abv) || null : null,
      description: extracted.description ? String(extracted.description).trim() : null,
      image_url: extracted.image_url ? String(extracted.image_url).trim() : null,
      brewed_at: extracted.brewed_at ? String(extracted.brewed_at).trim() : null,
      source_url: beerUrl,
      lifecycle_status: 'current',
    };

    const { data: existing } = await supabase
      .from('beers')
      .select('id')
      .eq('brewery_id', brewery.id)
      .ilike('name', name)
      .maybeSingle();

    let beerId: string;
    let action: 'inserted' | 'updated';
    if (existing?.id) {
      const { error: upErr } = await supabase.from('beers').update(payload).eq('id', existing.id);
      if (upErr) return json({ error: upErr.message }, 500);
      beerId = existing.id;
      action = 'updated';
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('beers')
        .insert(payload)
        .select('id')
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      beerId = ins.id;
      action = 'inserted';
    }

    return json({ success: true, action, beer_id: beerId, source_url: beerUrl, data: payload });
  } catch (e) {
    console.error('search-beer-firecrawl error', e);
    return json({ error: (e as Error).message ?? 'Onbekende fout' }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
