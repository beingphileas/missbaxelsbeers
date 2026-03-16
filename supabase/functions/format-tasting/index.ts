import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXAMPLE_FORMAT = `*Intro tekst met persoonlijk verhaal...*

## Tasting Notes

**Biertype:** [type]
**ABV:** [percentage]%
**Brouwerij:** [naam]
**Oorsprong:** [stad], België

### Visueel
[beschrijving uiterlijk, kleur, schuimkraag]

### Geur
[beschrijving aroma's]

### Smaak
[beschrijving smaak, mondgevoel, afdronk]

[Eventueel extra persoonlijke noot]

### Pairing
[suggesties voor eten]`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, imageUrl } = await req.json();
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "Geen tekst opgegeven" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Je bent de schrijfassistent van MissBaxels, een Belgische bierblog. 
Je krijgt een ruwe tasting-notitie en moet die omzetten naar een volledige blogpost in het exacte format hieronder.

BELANGRIJK:
- Behoud de persoonlijke stem en stijl van de auteur (informeel, warm, humoristisch)
- Vul ontbrekende secties aan op basis van de context, maar verzin GEEN feiten die niet in de tekst staan
- Als er geen ABV, brouwerij of oorsprong vermeld is, laat dan "[onbekend]" staan
- Schrijf in het Nederlands (Vlaamse stijl)
- De intro moet persoonlijk en verhalend zijn, net als de voorbeelden op de blog
- Geef ook een JSON-blok terug met metadata

FORMAT van de blogpost:
${EXAMPLE_FORMAT}

Na de blogpost, geef ALTIJD een JSON-blok op een nieuwe lijn, omsloten door \`\`\`json en \`\`\`:
\`\`\`json
{
  "title": "pakkende titel voor de post",
  "excerpt": "korte samenvatting van max 160 tekens",
  "tags": ["tag1", "tag2", "tag3"],
  "beerType": "bierstijl of null",
  "breweryName": "brouwerij naam of null"
}
\`\`\``;

    const userMessage = imageUrl
      ? `Hier is mijn tasting notitie (er hoort ook een foto bij):\n\n${text.trim()}`
      : `Hier is mijn tasting notitie:\n\n${text.trim()}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI Gateway error: ${res.status} - ${errText}`);
    }

    const aiResult = await res.json();
    const output = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON metadata from the response
    const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
    let metadata = { title: "Tasting", excerpt: "", tags: ["tasting"], beerType: null, breweryName: null };
    if (jsonMatch) {
      try {
        metadata = { ...metadata, ...JSON.parse(jsonMatch[1]) };
      } catch {}
    }

    // Extract the blog content (everything before the JSON block)
    let content = output.replace(/```json[\s\S]*?```/, "").trim();

    // Prepend image if provided
    if (imageUrl) {
      content = `![Tasting foto](${imageUrl})\n\n${content}`;
    }

    // Ensure 'tasting' tag is always present
    if (!metadata.tags.includes("tasting")) {
      metadata.tags.unshift("tasting");
    }

    return new Response(
      JSON.stringify({
        content,
        title: metadata.title,
        excerpt: metadata.excerpt || content.slice(0, 160).replace(/[#*\[\]!()]/g, ""),
        tags: metadata.tags,
        beerType: metadata.beerType,
        breweryName: metadata.breweryName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
