// Blog assistant edge function — AI schrijfhulp voor MissBaxel's Beers.
// Genereert VOORSTELLEN voor bierteksten in de stem van Marijke.
// Gebruikt de Lovable AI Gateway (LOVABLE_API_KEY).

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const STYLE_SYSTEM_PROMPT = `Je bent een schrijfhulp voor MissBaxel's Beers, het bierproject van Marijke Bax uit Brugge.
Je schrijft VOORSTELLEN voor bierteksten die Marijke daarna zelf nakijkt en aanpast. Lever nooit definitieve tekst af; je tekst is altijd een eerste versie.

STEM EN PERSPECTIEF
- Schrijf altijd in de ik- en wij-vorm. Nooit in de derde persoon over Marijke ("Marijke proeft", "zij ontdekt" — verboden).
- Koen mag in lopende tekst "hubby" heten. Gebruik het natuurlijk, niet geforceerd.
- Vlaamse, droge, soms omgekeerde zinnen mogen blijven staan. Strijk ze niet glad.

ZINTUIGLIJKE BEELDEN
- Beschrijf smaak, geur en uitzicht met eigen, alledaagse beelden.
  Voorbeelden: "een schuimkraag die snel de benen neemt", "het lijkt wel een koekje in de neus".
- Vermijd lege sommelierspraat zoals "tonen van leer en tabak", "verfijnd smaakprofiel", "elegante afdronk", "complexe nuances".

NIET DOEN
- Geen wervende inleidingen ("Ontdek de wereld van…", "Maak kennis met…").
- Geen drieslagen als ritmische truc ("ik proef, ik vraag, ik vertel").
- Geen "geen X, geen Y"-symmetrie als stijltruc.
- Geen gladde samenvattende afsluiters ("dat is het zo'n beetje", "kortom…").
- Geen titel of zin die net zo goed bij elk ander biermerk zou passen.

OPENING
- Begin met een korte anekdote of een concreet moment. Een glas op tafel, een gesprek met de brouwer, een avond in het restaurant — iets specifieks.

VASTE STRUCTUUR VAN EEN BIERSTUK
1. Korte persoonlijke intro (anekdote of moment, max enkele zinnen).
2. Feitenblok met de kopjes: Biertype, ABV, Brouwerij, Oorsprong.
3. Visueel — wat zie ik in het glas.
4. Geur — wat ruik ik, in eigen beelden.
5. Smaak — wat proef ik, in eigen beelden.
6. Persoonlijk afsluitzinnetje (één of twee zinnen, geen gladde wrap-up).
7. Pairing — bij welk gerecht of moment past dit.

ENGELSE VERSIE (optioneel)
- Als een Engelse versie gevraagd wordt, voeg die onderaan toe onder een duidelijke scheiding:
  ** EN VERSION **
  Hou dezelfde kopjes (Beer type, ABV, Brewery, Origin, Visual, Nose, Taste, Pairing) en dezelfde stem (I/we, hubby blijft hubby).

TITELS
- Eigenzinnige, grappige, soms rare titels horen erbij. Liever raar en eigen dan netjes en vergeetbaar.

HERINNERING
- Elke tekst die je teruggeeft is een VOORSTEL. Marijke leest het na, herschrijft en beslist.`;

interface ChatBody {
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  prompt?: string;
  model?: string;
  includeEnglish?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as ChatBody;
    const userMessages = body.messages ?? (body.prompt
      ? [{ role: "user" as const, content: body.prompt }]
      : []);

    if (userMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages or prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemContent = body.includeEnglish
      ? STYLE_SYSTEM_PROMPT + "\n\nVOEG OOK een Engelse versie toe onder ** EN VERSION **."
      : STYLE_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Te veel verzoeken — probeer het over een minuutje opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tegoed op — voeg credits toe in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("blog-assistant error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
