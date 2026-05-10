import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK = [
  ['Zure Pater', 'Sour - Other', 'zuur', 2021, 'De eerste blend — fris, droog en eerlijk zuur. Waar het allemaal begon.', 3.8],
  ['Zure Pater IPA', 'IPA - Sour', 'zuur', 2022, 'Zuur ontmoet hop. De bitterheid van de IPA werkt verrassend goed samen met de zuurheid.', 3.7],
  ['Zure Pater Q', 'Sour - Other', 'zuur', 2023, 'De Q staat voor kwaliteit en queeste — verfijnder, complexer, langer gerijpt.', 3.9],
  ['Zure Pater Easy', 'Blond - Other', 'wit', 2023, 'Toegankelijker en lichter van karakter, maar even eerlijk in aanpak.', 3.6],
  ['Zure Pater H', 'Gose - Sour', 'zuur', 2023, 'Een Gose-interpretatie met een zoute kant en het zuur dat de Bierstekers kenmerkt.', 3.7],
  ['Bierstekers Ode Lmbk', 'Lambic - Traditional', 'lambic', 2024, 'Een ode aan het lambic. Spontane gisting als inspiratiebron. Batch 1, BB 2026.', 3.8],
  ['Bierstekers Zwart', 'Sour - Dark', 'zwart', 2024, 'Zwarte mout ontmoet zuurheid — een onverwachte maar overtuigende combinatie.', 3.6],
  ['Bierstekers Zwart Smoked', 'Sour - Smoked', 'zwart', 2024, 'Gerookte mout geeft een extra dimensie. Campvuur, karamel en een zachte zuurheid.', 3.7],
  ['Bierstekers Zwart Odd Bruin', 'Flanders Red - Sour', 'zwart', 2024, 'Een knipoog naar de West-Vlaamse traditie van roodbruin. Donker, fruitig en aangenaam zuur.', 3.8],
  ['Bierstekers Zure', 'Sour - Other', 'zuur', 2024, 'De pure essentie van het Bierstekers-concept: zuur, eerlijk, ongefiltreerd.', 3.6],
  ['Bierstekers Wit', 'Witbier - Blend', 'wit', 2024, 'Een witbierbasis met de Bierstekers-touch. Fris, licht kruidig en perfect voor zomerse dagen.', 3.6],
  ['Bierstekers Wit Zuur', 'Sour - Other', 'wit', 2025, 'Friszure combinatie — een Belgische lemonade voor volwassenen.', 3.7],
  ['Wit Schaerbeekse Kriek', 'Lambic - Kriek', 'lambic', 2025, 'De zeldzame Schaerbeekse kriek als basis — een kers die herbloeit in dit bijzondere blend.', 3.9],
];

async function tryUntappd(): Promise<any[] | null> {
  try {
    const r = await fetch('https://untappd.com/Biersteker', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' },
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Untappd brewery beer list pattern
    const blocks = html.match(/<div[^>]+class="beer-item[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || [];
    if (blocks.length < 3) return null;
    const out: any[] = [];
    for (const b of blocks) {
      const name = (b.match(/<p[^>]+class="name"[^>]*>\s*<a[^>]*>([^<]+)</) || [])[1];
      const style = (b.match(/<p[^>]+class="style"[^>]*>([^<]+)</) || [])[1];
      const score = (b.match(/caps[^"]*data-rating="([\d.]+)"/) || [])[1];
      const url = (b.match(/<a[^>]+href="(\/b\/[^"]+)"/) || [])[1];
      if (name) out.push({
        name: name.trim(),
        style: style?.trim() || null,
        untappd_score: score ? Number(score) : null,
        untappd_url: url ? `https://untappd.com${url}` : null,
      });
    }
    return out.length >= 3 ? out : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const scraped = await tryUntappd();
    let inserted = 0;
    let source: 'untappd' | 'fallback' = 'fallback';

    if (scraped && scraped.length) {
      source = 'untappd';
      const { error, count } = await supabase.from('bierstekers_blends').insert(scraped, { count: 'exact' });
      if (error) throw error;
      inserted = count ?? scraped.length;
    } else {
      const rows = FALLBACK.map(([name, style, style_category, year, description, untappd_score]) => ({
        name, style, style_category, year, description, untappd_score,
      }));
      const { error, count } = await supabase.from('bierstekers_blends').insert(rows, { count: 'exact' });
      if (error) throw error;
      inserted = count ?? rows.length;
    }

    return new Response(JSON.stringify({ source, inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
