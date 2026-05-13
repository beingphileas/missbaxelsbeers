import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

type Query = {
  beer_name?: string;
  brewery_name?: string;
  shop_name?: string;
  shop_city?: string;
  location_name?: string;
};

type FieldEntry = { value: any; source: string };
type Out = { fields: Record<string, FieldEntry>; missing: string[] };

const RUBRIC_FIELDS: Record<string, string[]> = {
  proefnotitie: ['style', 'abv', 'brewery_name', 'untappd_score', 'untappd_url', 'ratebeer_score', 'ratebeer_url'],
  brouwerij: ['address', 'opening_hours', 'google_rating', 'google_maps_url', 'website_url', 'shop_city', 'untappd_rating', 'untappd_url'],
  hidden_gem: ['style', 'abv', 'untappd_score', 'untappd_url', 'check_in_count'],
  bier_en_eten: ['style', 'abv', 'untappd_score'],
  biertrip: ['address', 'google_rating', 'google_maps_url', 'opening_hours', 'cover_image_url', 'shop_city'],
  bioshop: ['address', 'google_rating', 'google_maps_url', 'opening_hours', 'website_url', 'cover_image_url', 'shop_url', 'shop_city'],
  missbaxel_bier: ['style', 'abv', 'flavor_profile', 'food_pairing', 'image_url', 'cover_image_url', 'brewery_id', 'untappd_score', 'untappd_url', 'check_in_count'],
};

function setField(out: Out, key: string, value: any, source: string) {
  if (value === null || value === undefined || value === '') return;
  if (out.fields[key]) return; // first writer wins (internal_db before external)
  out.fields[key] = { value, source };
}

async function lookupInternalBeer(supabase: any, out: Out, beerName: string, breweryName?: string) {
  let q = supabase
    .from('beers')
    .select('id, name, style, abv, flavor_profile, food_pairing, image_url, brewery_id')
    .ilike('name', `%${beerName}%`)
    .limit(5);
  const { data } = await q;
  if (!data?.length) return;
  let best = data[0];
  if (breweryName) {
    const { data: matches } = await supabase
      .from('beer_breweries')
      .select('beer_id, breweries:brewery_id(name)')
      .in('beer_id', data.map((b: any) => b.id));
    const hit = matches?.find((m: any) => m.breweries?.name?.toLowerCase().includes(breweryName.toLowerCase()));
    if (hit) best = data.find((b: any) => b.id === hit.beer_id) || best;
  }
  setField(out, 'style', best.style, 'internal_db');
  setField(out, 'abv', best.abv, 'internal_db');
  setField(out, 'flavor_profile', best.flavor_profile, 'internal_db');
  setField(out, 'food_pairing', best.food_pairing, 'internal_db');
  setField(out, 'image_url', best.image_url, 'internal_db');
  setField(out, 'cover_image_url', best.image_url, 'internal_db');
  setField(out, 'brewery_id', best.brewery_id, 'internal_db');
}

async function lookupInternalBrewery(supabase: any, out: Out, breweryName: string) {
  const { data } = await supabase
    .from('breweries')
    .select('id, name, address, website_url, google_url, google_rating, untappd_url, untappd_rating, municipality, image_url')
    .ilike('name', `%${breweryName}%`)
    .limit(1);
  const b = data?.[0];
  if (!b) return;
  setField(out, 'address', b.address, 'internal_db');
  setField(out, 'website_url', b.website_url, 'internal_db');
  setField(out, 'google_maps_url', b.google_url, 'internal_db');
  setField(out, 'google_rating', b.google_rating, 'internal_db');
  setField(out, 'untappd_url', b.untappd_url, 'internal_db');
  setField(out, 'untappd_rating', b.untappd_rating, 'internal_db');
  setField(out, 'shop_city', b.municipality, 'internal_db');
  setField(out, 'cover_image_url', b.image_url, 'internal_db');
  setField(out, 'brewery_name', b.name, 'internal_db');
}

async function lookupGooglePlaces(out: Out, queryText: string) {
  const key = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!key) return;
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.googleMapsUri,places.websiteUri,places.regularOpeningHours,places.photos,places.addressComponents',
      },
      body: JSON.stringify({ textQuery: queryText, languageCode: 'nl', maxResultCount: 1 }),
    });
    if (!r.ok) {
      console.error('Google Places error', r.status, await r.text().catch(() => ''));
      return;
    }
    const data = await r.json();
    const p = data.places?.[0];
    if (!p) return;
    setField(out, 'address', p.formattedAddress, 'google_places');
    setField(out, 'google_rating', p.rating, 'google_places');
    setField(out, 'google_maps_url', p.googleMapsUri, 'google_places');
    setField(out, 'website_url', p.websiteUri, 'google_places');
    if (p.regularOpeningHours?.weekdayDescriptions) {
      setField(out, 'opening_hours', p.regularOpeningHours.weekdayDescriptions, 'google_places');
    }
    const city = p.addressComponents?.find((c: any) => c.types?.includes('locality'))?.longText
      || p.addressComponents?.find((c: any) => c.types?.includes('postal_town'))?.longText;
    if (city) setField(out, 'shop_city', city, 'google_places');
    const photo = p.photos?.[0]?.name;
    if (photo) {
      const photoUrl = `https://places.googleapis.com/v1/${photo}/media?maxWidthPx=1200&key=${key}`;
      setField(out, 'cover_image_url', photoUrl, 'google_places');
    }
    if (!out.fields['shop_url'] && p.websiteUri) setField(out, 'shop_url', p.websiteUri, 'google_places');
  } catch (e) {
    console.error('Google Places exception', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json() as { rubric: string; query: Query };
    const rubric = body.rubric;
    const query = body.query || {};
    if (!rubric) {
      return new Response(JSON.stringify({ error: 'rubric required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const out: Out = { fields: {}, missing: [] };

    // 1) Internal lookups (free + instant)
    if (query.beer_name) {
      await lookupInternalBeer(supabase, out, query.beer_name, query.brewery_name);
    }
    if (query.brewery_name) {
      await lookupInternalBrewery(supabase, out, query.brewery_name);
    }

    // 2) Google Places for location-based rubrics
    if (rubric === 'bioshop' && query.shop_name) {
      const q = [query.shop_name, query.shop_city].filter(Boolean).join(' ');
      await lookupGooglePlaces(out, q);
    } else if (rubric === 'biertrip' && query.location_name) {
      await lookupGooglePlaces(out, query.location_name);
    } else if (rubric === 'brouwerij' && query.brewery_name && !out.fields['address']) {
      await lookupGooglePlaces(out, `brouwerij ${query.brewery_name}`);
    }

    // 3) Untappd / external beer scores: not directly callable without credentials.
    //    The factcheck-beer / scrape-beer-firecrawl functions need a beer ID.
    //    For now, we rely on internal_db data and leave external scores to be
    //    filled in later. Fields not found are reported in `missing`.

    const expected = RUBRIC_FIELDS[rubric] || [];
    out.missing = expected.filter((f) => !(f in out.fields));

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('enrich-post-context error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
