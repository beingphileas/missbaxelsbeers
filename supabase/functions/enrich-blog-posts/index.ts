import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SYSTEM = `Je bent een Belgische bier-redacteur. Op basis van een blogpost over bier geef je gestructureerde metadata terug. Antwoord enkel via de tool 'set_metadata'. Schrijf in het Nederlands, beknopt en in de warme, persoonlijke stijl van MissBaxel.`;

const TOOL = {
  type: 'function',
  function: {
    name: 'set_metadata',
    description: 'Geeft metadata voor een bier-blogpost.',
    parameters: {
      type: 'object',
      properties: {
        excerpt: { type: 'string', description: 'Korte teaser (max 200 tekens), geen titel herhalen.' },
        style: { type: 'string', description: 'Bierstijl, bv. Tripel, Saison, Geuze, Imperial Stout.' },
        style_category: {
          type: 'string',
          enum: ['tripel', 'saison', 'donker', 'zuur', 'wit', 'speciaal'],
          description: 'Algemene categorie.',
        },
        image_emoji: { type: 'string', description: 'Eén passend emoji voor het bier.' },
        brewery_name: { type: 'string', description: 'Naam van de brouwerij indien duidelijk vermeld, anders lege string.' },
      },
      required: ['excerpt', 'style', 'style_category', 'image_emoji'],
      additionalProperties: false,
    },
  },
};

async function enrichOne(post: any) {
  const userMsg = `TITEL: ${post.title}\n\nINHOUD:\n${(post.content || '').slice(0, 6000)}`;
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userMsg },
      ],
      tools: [TOOL],
      tool_choice: { type: 'function', function: { name: 'set_metadata' } },
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error('Geen tool-call in respons');
  return JSON.parse(args);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const onlyMissing: boolean = body.onlyMissing !== false;
    const ids: string[] | undefined = body.ids;
    const limit: number = Math.min(body.limit ?? 50, 200);

    let q = supabase.from('blog_posts').select('id, title, content, excerpt, style, style_category, image_emoji, brewery_name');
    if (ids?.length) q = q.in('id', ids);
    else if (onlyMissing) {
      q = q.or('style.is.null,style_category.is.null,excerpt.is.null,image_emoji.is.null');
    }
    q = q.limit(limit);
    const { data: posts, error } = await q;
    if (error) throw error;

    let updated = 0, errors = 0;
    for (const p of posts || []) {
      try {
        if (!p.content || p.content.length < 50) continue;
        const meta = await enrichOne(p);
        const patch: any = {};
        if (!p.excerpt && meta.excerpt) patch.excerpt = meta.excerpt;
        if (!p.style && meta.style) patch.style = meta.style;
        if (!p.style_category && meta.style_category) patch.style_category = meta.style_category;
        if (!p.image_emoji && meta.image_emoji) patch.image_emoji = meta.image_emoji;
        if (!p.brewery_name && meta.brewery_name) patch.brewery_name = meta.brewery_name;
        if (Object.keys(patch).length > 0) {
          const { error: e2 } = await supabase.from('blog_posts').update(patch).eq('id', p.id);
          if (e2) throw e2;
          updated++;
        }
        await new Promise((r) => setTimeout(r, 800));
      } catch (e) {
        console.error('enrich error', p.id, e);
        errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, total: posts?.length ?? 0, updated, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
