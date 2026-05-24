import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { checkRateLimit, rateLimitKey, rateLimitResponse } from '../_shared/rateLimit.ts';

// NOTE: translate is intentionally public — it powers visitor-facing i18n
// (Dutch -> English/French) via the useLanguage hook. Gating to admin would
// break translation for all anonymous visitors. Abuse is mitigated by an
// IP-based rate limit (30 req / 10 min) backed by the rate_limits table.

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const MODEL = 'google/gemini-2.5-flash-lite';

interface ReqBody {
  texts: string[];
  target_lang: 'nl' | 'en' | 'fr';
}

const LANG_NAMES: Record<string, string> = {
  nl: 'Dutch',
  en: 'English',
  fr: 'French',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: 'LOVABLE_API_KEY not set' }, 500);
    }

    // IP-based rate limit for this public endpoint.
    const rl = await checkRateLimit(rateLimitKey(req, null), 'translate');
    if (!rl.ok) return rateLimitResponse(rl, corsHeaders);

    const body = (await req.json()) as ReqBody;
    if (!Array.isArray(body.texts) || !body.target_lang) {
      return json({ error: 'Invalid body. Expected { texts: string[], target_lang }' }, 400);
    }
    const texts = body.texts.filter((t) => typeof t === 'string' && t.trim().length > 0);
    if (texts.length === 0) return json({ translations: {} });
    if (body.target_lang === 'nl') {
      const map: Record<string, string> = {};
      for (const t of texts) map[t] = t;
      return json({ translations: map });
    }

    const targetName = LANG_NAMES[body.target_lang] || body.target_lang;
    const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const prompt = `Translate the following UI strings from Dutch to ${targetName}. Return ONLY a JSON object mapping the ORIGINAL Dutch string (exactly as provided) to its translation. Keep brand names, beer names and proper nouns unchanged. Preserve punctuation and capitalisation style.\n\nStrings:\n${numbered}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a precise translator. Always reply with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return json({ error: `AI gateway error (${resp.status}): ${errText}` }, 502);
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }
    // Ensure we return entries for every requested text
    const out: Record<string, string> = {};
    for (const t of texts) out[t] = parsed[t] || t;
    return json({ translations: out });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
