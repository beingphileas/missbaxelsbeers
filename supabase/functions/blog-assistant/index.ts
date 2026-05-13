import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const VOICE_PROMPT = `Je bent de schrijfassistent van MissBaxel's Beers. Je schrijft blogposts voor Marijke Bax — warm, direct, persoonlijk. Nooit meer dan 500 woorden. Geen bulletpoints, geen tussentitels, geen bierjargon. Eindig altijd met één echte vraag aan de lezer. Verzin NOOIT bierdetails die Marijke je niet heeft gegeven. Schrijf in het Nederlands.`;

const INTERVIEW_PROMPT = `${VOICE_PROMPT}

Je bent nu in INTERVIEW-modus. Stel maximaal 4 korte, concrete vragen aan Marijke om de échte details voor de blogpost te verzamelen. Stel ÉÉN vraag per beurt, kort (max 1 zin), en wacht op haar antwoord voor je de volgende stelt.

Pas je vragen aan op de titel die ze opgaf. Voorbeelden van goede vragen bij een biertitel:
- Welke brouwerij maakt dit bier?
- Waar of wanneer dronk je het?
- Wat verraste je eraan?
- Wat zou je een vriend hierover zeggen?

Geen smalltalk, geen herhalingen, geen samenvatting. Alleen de volgende vraag.

Verzin NOOIT antwoorden in de plaats van Marijke. Als je 4 vragen hebt gesteld én beantwoord, antwoord je exact met: [READY]`;

const DRAFT_PROMPT = `${VOICE_PROMPT}

Je bent nu in DRAFT-modus. Schrijf de volledige blogpost (350–500 woorden) op basis van de details die Marijke gaf in het interview. 

Structuur (zonder labels of headers in de output):
- Opening: één scherp moment of scène, zonder aanloop.
- Midden: het verhaal — het bier, de context, wat haar verraste, één concreet detail (smaak, persoon, plek).
- Eén korte alinea met een pairing of praktische tip.
- Slotzin: één echte vraag aan de lezer.

Geen bulletpoints, geen tussentitels, geen bierjargon. Gebruik enkel de feiten die Marijke gaf — verzin NIETS. Schrijf in het Nederlands.

Geef ALLEEN de blogpost-tekst terug, geen inleiding, geen uitleg.`;

const BIERSHOP_INTERVIEW_PROMPT = `${VOICE_PROMPT}

Je bent in INTERVIEW-modus voor een BIERSHOP-review. Stel deze 5 vragen één voor één, in deze volgorde, kort (1 zin), en wacht telkens op antwoord:

1. Welke shop is het, en waar ligt die?
2. Wat trok je er naartoe — tip van iemand, toevallig voorbijgelopen, al langer op de lijst?
3. Wat viel je op — het aanbod, de mensen, de sfeer?
4. Kocht je iets specifieks, en wat vond je ervan?
5. Voor wie is dit een aanrader?

Geen smalltalk, geen samenvatting, geen herhaling. Stel ÉÉN vraag per beurt. Verzin NOOIT antwoorden in haar plaats. Wanneer alle 5 vragen beantwoord zijn, antwoord je exact met: [READY]`;

const BIERSHOP_DRAFT_PROMPT = `${VOICE_PROMPT}

Je bent in DRAFT-modus voor een biershop-review. Schrijf 300–450 woorden op basis van wat Marijke vertelde.

Structuur (zonder labels of headers):
- Opening: één scherp moment of scène in de winkel.
- Midden: het verhaal — wat haar trok, wat opviel, de mensen, het aanbod, wat ze kocht.
- Eén korte alinea: voor wie is dit een aanrader.
- Slotzin: één echte vraag aan de lezer.

BELANGRIJK: De scores (aanbod/kennis/sfeer/prijs/algemeen) verschijnen apart in een kaartje — herhaal ze NIET letterlijk in de tekst. Je mag wel in passing iets zeggen ("de jongen achter de toog wist écht waar hij over praatte"), maar geen cijfers.

Geen bulletpoints, geen tussentitels. Verzin NIETS. Schrijf in het Nederlands. Geef ALLEEN de blogpost-tekst terug.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mode, flow, title, messages } = await req.json() as {
      mode: 'interview' | 'draft';
      flow?: 'beer' | 'biershop';
      title?: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!mode || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'mode and messages required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const titleLower = (title || '').toLowerCase();
    const autoBiershop = /\b(shop|winkel|bier bij)\b/.test(titleLower);
    const effectiveFlow = flow === 'biershop' || autoBiershop ? 'biershop' : 'beer';

    const systemBase = effectiveFlow === 'biershop'
      ? (mode === 'interview' ? BIERSHOP_INTERVIEW_PROMPT : BIERSHOP_DRAFT_PROMPT)
      : (mode === 'interview' ? INTERVIEW_PROMPT : DRAFT_PROMPT);
    const system = title?.trim()
      ? `${systemBase}\n\nDe titel die Marijke opgaf: "${title.trim()}"`
      : systemBase;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        max_tokens: 1000,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit bereikt, probeer zo opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI-credits op. Voeg credits toe in Settings → Workspace → Usage.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const ready = mode === 'interview' && content.trim().toUpperCase().includes('[READY]');

    return new Response(JSON.stringify({ content: content.replace(/\[READY\]/gi, '').trim(), ready }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('blog-assistant error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
