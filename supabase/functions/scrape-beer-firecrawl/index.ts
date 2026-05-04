// Scrape a beer page (Untappd / RateBeer / etc.) via Firecrawl LLM extraction
// and upsert it into the `beers` table.
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
    name: { type: 'string', description: 'Beer name' },
    style: { type: 'string', description: 'Beer style (e.g. Saison, IPA)' },
    abv: { type: 'number', description: 'Alcohol by volume in percent' },
    ibu: { type: 'number', description: 'International Bittering Units' },
    description: {
      type: 'string',
      description: 'Story / flavor profile / tasting notes',
    },
    image_url: { type: 'string', description: 'Link to label / bottle image' },
    brewed_at: {
      type: 'string',
      description:
        'The brewery where this beer is actually brewed / collab partner',
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
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url || !/^https?:\/\//i.test(url)) {
      return json({ error: 'Ongeldige URL' }, 400);
    }

    // 1) Call Firecrawl scrape with JSON extraction
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
              'Extract beer information from this page. Fields: name (beer name), style (beer style), abv (alcohol % as number), ibu (bitterness as number, optional), description (the story / flavor profile / tasting notes — combine if multiple), image_url (label / bottle image URL), brewed_at (the brewery that actually brews this beer / collab partner — extract the brewery name only, no city). If a field is unknown, omit it. Return only the requested fields.',
          },
        ],
      }),
    });

    const fcData = await fcResp.json().catch(() => null);
    if (!fcResp.ok) {
      console.error('Firecrawl error', fcResp.status, fcData);
      return json(
        {
          error:
            fcData?.error || `Firecrawl mislukt (${fcResp.status})`,
        },
        502,
      );
    }

    const extracted =
      fcData?.data?.json ??
      fcData?.json ??
      fcData?.data?.extract ??
      null;

    if (!extracted || typeof extracted !== 'object' || !extracted.name) {
      return json(
        {
          error:
            'Firecrawl gaf geen bruikbare data terug (geen naam gevonden).',
          raw: extracted,
        },
        422,
      );
    }

    // 2) Upsert into beers table (matching MissBaxel's brewery)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: brewery, error: brewErr } = await supabase
      .from('breweries')
      .select('id')
      .eq('name', "MissBaxel's Beers")
      .maybeSingle();

    if (brewErr || !brewery) {
      return json(
        { error: 'Hoofd-brouwerij (MissBaxel\'s Beers) niet gevonden' },
        500,
      );
    }

    const name = String(extracted.name).trim();
    const payload: Record<string, unknown> = {
      brewery_id: brewery.id,
      name,
      style: String(extracted.style ?? 'Onbekend').trim(),
      abv:
        typeof extracted.abv === 'number'
          ? extracted.abv
          : extracted.abv
            ? Number(extracted.abv) || null
            : null,
      description: extracted.description
        ? String(extracted.description).trim()
        : null,
      image_url: extracted.image_url
        ? String(extracted.image_url).trim()
        : null,
      brewed_at: extracted.brewed_at
        ? String(extracted.brewed_at).trim()
        : null,
      source_url: url,
      lifecycle_status: 'current',
    };

    // Check if beer already exists for this brewery
    const { data: existing } = await supabase
      .from('beers')
      .select('id')
      .eq('brewery_id', brewery.id)
      .ilike('name', name)
      .maybeSingle();

    let beerId: string;
    let action: 'inserted' | 'updated';
    if (existing?.id) {
      const { error: upErr } = await supabase
        .from('beers')
        .update(payload)
        .eq('id', existing.id);
      if (upErr) return json({ error: upErr.message }, 500);
      beerId = existing.id;
      action = 'updated';
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('beers')
        .insert(payload)
        .select('id')
        .single();
      if (insErr) return json({ error: insErr.message }, 500);
      beerId = inserted.id;
      action = 'inserted';
    }

    return json({ success: true, action, beer_id: beerId, data: payload });
  } catch (e) {
    console.error('scrape-beer-firecrawl error', e);
    return json({ error: (e as Error).message ?? 'Onbekende fout' }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
