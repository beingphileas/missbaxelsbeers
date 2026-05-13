import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Rubric definitions — kept in sync with src/lib/rubrics.ts
type RubricDef = {
  label: string;
  wordCount: [number, number];
  interviewQuestions: string[];
  draftInstructions: string;
  hasScores: boolean;
};

const RUBRICS: Record<string, RubricDef> = {
  proefnotitie: {
    label: 'Proefnotitie',
    wordCount: [300, 500],
    interviewQuestions: [
      'Welk bier is het, en waar dronk je het?',
      'Wat verwachtte je, en wat verraste je?',
      'Hoe smaakte het — in je eigen woorden, niet technisch?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions: 'Open met een moment of scène. Beschrijf de smaak in mensentaal. Sluit af met een vraag.',
    hasScores: true,
  },
  brouwerij: {
    label: 'Brouwerij in de kijker',
    wordCount: [400, 600],
    interviewQuestions: [
      'Welke brouwerij is het, en waar ligt die?',
      'Hoe kwam je ermee in contact?',
      'Wat maakt deze brouwerij anders dan anderen?',
      'Welk bier moet je er absoluut proberen?',
      'Voor wie is een bezoek of aankoop een aanrader?',
    ],
    draftInstructions: 'Focus op de mensen achter de brouwerij, niet op technische details. Vertel het verhaal alsof je het aan een vriend vertelt.',
    hasScores: true,
  },
  hidden_gem: {
    label: 'Hidden gem',
    wordCount: [250, 400],
    interviewQuestions: [
      'Wat is het — bier, brouwerij of plek?',
      'Hoe vond je het?',
      'Waarom verdient het meer aandacht?',
      'Waar kan je het vinden?',
    ],
    draftInstructions: 'Kort en overtuigend. Dit is een tip, geen essay. De lezer moet het willen opzoeken.',
    hasScores: true,
  },
  bier_en_eten: {
    label: 'Bier & eten',
    wordCount: [300, 450],
    interviewQuestions: [
      'Welk bier en welk gerecht?',
      'Hoe kwam je op de combinatie?',
      'Wat maakte het werken — of juist niet?',
      'Hoe makkelijk is het thuis na te maken?',
    ],
    draftInstructions: 'Concreet en praktisch. Geef de lezer iets om vanavond mee te proberen.',
    hasScores: true,
  },
  column: {
    label: 'Column',
    wordCount: [300, 500],
    interviewQuestions: [
      'Waar gaat de column over — wat irriteert, verrast of inspireert je?',
      'Wat is je standpunt in één zin?',
      'Wat wil je dat de lezer denkt of doet na het lezen?',
    ],
    draftInstructions: 'Direct en persoonlijk. Geen opsommingen. Eindig met een stelling, niet een vraag.',
    hasScores: false,
  },
  biertrip: {
    label: 'Biertrip',
    wordCount: [400, 650],
    interviewQuestions: [
      'Waar ging je naartoe?',
      'Wat was de aanleiding?',
      'Wat was het hoogtepunt?',
      'Wat had je beter kunnen weten op voorhand?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions: 'Vertel het als een verhaal, niet als een reisverslag. Eén moment dat alles samenvat.',
    hasScores: true,
  },
  seizoen: {
    label: 'Seizoen & sfeer',
    wordCount: [200, 350],
    interviewQuestions: [
      'Welk seizoen of moment?',
      'Welk bier hoort daarbij voor jou?',
      'Wat maakt die combinatie kloppen?',
    ],
    draftInstructions: 'Sfeervol en kort. Dit is een ode, geen review. Maximaal 350 woorden.',
    hasScores: false,
  },
  missbaxel_bier: {
    label: "MissBaxel's bier",
    wordCount: [400, 600],
    interviewQuestions: [
      'Over welk bier gaat het?',
      'Hoe ontstond het idee?',
      'Wat was de rol van de brouwerij?',
      'Wat zou je de volgende keer anders doen?',
      'Wat moet de lezer weten voor ze het proberen?',
    ],
    draftInstructions: 'Eerlijk en persoonlijk — ook over wat niet perfect is. Dit is geen reclamefolder.',
    hasScores: true,
  },
  bioshop: {
    label: 'Biershop',
    wordCount: [300, 450],
    interviewQuestions: [
      'Welke shop, en waar?',
      'Wat trok je er naartoe?',
      'Wat viel je op — aanbod, mensen, sfeer?',
      'Kocht je iets specifieks?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions: 'Warm en concreet. De score staat apart — de tekst hoeft de cijfers niet te herhalen.',
    hasScores: true,
  },
};

const VOICE_PROMPT = `Je bent de schrijfassistent van MissBaxel's Beers. Je schrijft blogposts voor Marijke Bax — warm, direct, persoonlijk. Geen bulletpoints, geen tussentitels, geen bierjargon. Verzin NOOIT details die Marijke je niet heeft gegeven. Schrijf in het Nederlands.`;

function buildInterviewPrompt(rubric?: string): string {
  const def = rubric ? RUBRICS[rubric] : null;
  if (!def) {
    return `${VOICE_PROMPT}

Je bent in INTERVIEW-modus. Stel maximaal 4 korte, concrete vragen aan Marijke om de échte details voor de blogpost te verzamelen. Stel ÉÉN vraag per beurt, kort (max 1 zin), wacht op antwoord voor de volgende. Verzin NOOIT antwoorden in haar plaats. Wanneer je genoeg context hebt, antwoord exact met: [READY]`;
  }
  const list = def.interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  return `${VOICE_PROMPT}

Je bent in INTERVIEW-modus voor de rubriek "${def.label}". Stel deze vragen één voor één, in deze volgorde, kort (1 zin), en wacht telkens op antwoord:

${list}

Geen smalltalk, geen samenvatting, geen herhaling. Stel ÉÉN vraag per beurt. Verzin NOOIT antwoorden in haar plaats. Wanneer alle vragen beantwoord zijn, antwoord je exact met: [READY]`;
}

function buildDraftPrompt(rubric?: string): string {
  const def = rubric ? RUBRICS[rubric] : null;
  if (!def) {
    return `${VOICE_PROMPT}

Je bent in DRAFT-modus. Schrijf de volledige blogpost (350–500 woorden) op basis van wat Marijke gaf. Geen bulletpoints, geen tussentitels. Eindig met één echte vraag aan de lezer. Geef ALLEEN de blogpost-tekst terug.`;
  }
  const [min, max] = def.wordCount;
  const scoreNote = def.hasScores
    ? '\n\nBELANGRIJK: Eventuele scores verschijnen apart in een kaartje — herhaal cijfers NIET letterlijk in de tekst. Je mag wel in passing iets zeggen, maar geen rangen of getallen.'
    : '';
  return `${VOICE_PROMPT}

Je bent in DRAFT-modus voor de rubriek "${def.label}". Schrijf ${min}–${max} woorden op basis van wat Marijke vertelde.

Stijlgids voor deze rubriek: ${def.draftInstructions}${scoreNote}

Verzin NIETS. Schrijf in het Nederlands. Geef ALLEEN de blogpost-tekst terug, geen inleiding, geen uitleg.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mode, rubric, title, messages, enrichment } = await req.json() as {
      mode: 'interview' | 'draft';
      rubric?: string;
      title?: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
      enrichment?: Record<string, { value: any; source: string }>;
    };

    if (!mode || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'mode and messages required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemBase = mode === 'interview' ? buildInterviewPrompt(rubric) : buildDraftPrompt(rubric);
    let system = title?.trim()
      ? `${systemBase}\n\nDe titel die Marijke opgaf: "${title.trim()}"`
      : systemBase;
    if (enrichment && Object.keys(enrichment).length > 0) {
      const summary = Object.entries(enrichment)
        .map(([k, v]) => `- ${k}: ${Array.isArray(v.value) ? v.value.join(', ') : v.value} (bron: ${v.source})`)
        .join('\n');
      system += `\n\nBeschikbare data voor dit bier/deze locatie:\n${summary}\n\nGebruik deze gegevens als feitelijke basis. Verzin niets wat hier niet in staat.`;
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        max_tokens: 1200,
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
