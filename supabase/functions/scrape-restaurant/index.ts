import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ');
}

async function fetchText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return '';
    return await r.text();
  } catch { return ''; }
}

const HEALTH_KEY = 'scrape-restaurant';

async function reportHealth(supabase: any, status: 'ok' | 'error', error: string | null) {
  await supabase.from('system_health').upsert({
    key: HEALTH_KEY,
    last_run_at: new Date().toISOString(),
    last_status: status,
    last_error: error,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  try {
    const sources = [
      'https://www.missbaxelsbeers.com',
      'https://www.missbaxelsbeers.com/restaurant',
      'https://www.nieuwmuseum.be',
    ];

    let combined = '';
    for (const u of sources) combined += '\n' + (await fetchText(u));

    const phoneMatch = combined.match(/(?:\+32\s?|0)\s?(?:5\s?0|4\d{2})[\s.\-/]?\d{2}[\s.\-/]?\d{2}[\s.\-/]?\d{2}/);
    const emailMatch = combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const addrMatch = combined.match(/([A-Z][a-zëéèïóàâ]+(?:straat|laan|plein|weg|wal|kaai|markt|steenweg|dreef)\s+\d+\w?)/);

    const update: any = {
      name: "Bij Koen & Marijke in 't Nieuw Museum",
      city: 'Brugge',
      instagram_url: 'https://www.instagram.com/missbaxelsbeers/',
    };
    if (phoneMatch) update.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
    if (emailMatch && !emailMatch[0].includes('example')) update.email = decode(emailMatch[0]);
    if (addrMatch) {
      update.address = decode(addrMatch[1]);
      update.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(update.address + ', Brugge')}`;
    }

    const { error } = await supabase.from('restaurant').upsert({ id: 1, ...update });
    if (error) throw error;

    await reportHealth(supabase, 'ok', null);
    return new Response(JSON.stringify({ updated_fields: Object.keys(update) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    await reportHealth(supabase, 'error', e?.message || String(e));
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
