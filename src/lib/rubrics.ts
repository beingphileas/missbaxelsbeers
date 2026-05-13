// Single source of truth for blog post rubrics.
// Used by the admin PostForm, the public BlogPost score card, the
// /verhalen filter pills, and the AI assistant edge function.

export type RubricKey =
  | 'proefnotitie'
  | 'brouwerij'
  | 'hidden_gem'
  | 'bier_en_eten'
  | 'column'
  | 'biertrip'
  | 'seizoen'
  | 'missbaxel_bier'
  | 'bioshop';

export interface RubricScoreField {
  key: string;
  label: string;
}

export interface RubricDef {
  label: string;
  icon: string; // lucide-react icon name
  color: string; // CSS variable expression
  description: string;
  scores: RubricScoreField[];
  wordCount: [number, number];
  interviewQuestions: string[];
  draftInstructions: string;
}

export const RUBRICS: Record<RubricKey, RubricDef> = {
  proefnotitie: {
    label: 'Proefnotitie',
    icon: 'FlaskConical',
    color: 'var(--hop)',
    description: 'Eén bier, één moment, persoonlijk.',
    scores: [
      { key: 'smaak', label: 'Smaak' },
      { key: 'afdronk', label: 'Afdronk' },
      { key: 'originaliteit', label: 'Originaliteit' },
      { key: 'prijs_kwaliteit', label: 'Prijs/kwaliteit' },
    ],
    wordCount: [300, 500],
    interviewQuestions: [
      'Welk bier is het, en waar dronk je het?',
      'Wat verwachtte je, en wat verraste je?',
      'Hoe smaakte het — in je eigen woorden, niet technisch?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions:
      'Open met een moment of scène. Beschrijf de smaak in mensentaal. Sluit af met een vraag.',
  },
  brouwerij: {
    label: 'Brouwerij in de kijker',
    icon: 'Factory',
    color: 'var(--amber)',
    description: 'Spotlight op een brouwer of brouwerij.',
    scores: [
      { key: 'verhaal', label: 'Het verhaal' },
      { key: 'aanbod', label: 'Aanbod' },
      { key: 'bezoekbaarheid', label: 'Bezoekbaarheid' },
      { key: 'duurzaamheid', label: 'Duurzaamheid' },
    ],
    wordCount: [400, 600],
    interviewQuestions: [
      'Welke brouwerij is het, en waar ligt die?',
      'Hoe kwam je ermee in contact?',
      'Wat maakt deze brouwerij anders dan anderen?',
      'Welk bier moet je er absoluut proberen?',
      'Voor wie is een bezoek of aankoop een aanrader?',
    ],
    draftInstructions:
      'Focus op de mensen achter de brouwerij, niet op technische details. Vertel het verhaal alsof je het aan een vriend vertelt.',
  },
  hidden_gem: {
    label: 'Hidden gem',
    icon: 'Gem',
    color: 'var(--copper)',
    description: 'Onbekend maar goed.',
    scores: [
      { key: 'onbekendheid', label: 'Hoe onbekend' },
      { key: 'kwaliteit', label: 'Kwaliteit' },
      { key: 'toegankelijkheid', label: 'Toegankelijkheid' },
      { key: 'vibe', label: 'Vibe' },
    ],
    wordCount: [250, 400],
    interviewQuestions: [
      'Wat is het — bier, brouwerij of plek?',
      'Hoe vond je het?',
      'Waarom verdient het meer aandacht?',
      'Waar kan je het vinden?',
    ],
    draftInstructions:
      'Kort en overtuigend. Dit is een tip, geen essay. De lezer moet het willen opzoeken.',
  },
  bier_en_eten: {
    label: 'Bier & eten',
    icon: 'UtensilsCrossed',
    color: 'var(--hop)',
    description: 'Pairings en keukeninspiratie.',
    scores: [
      { key: 'combinatie', label: 'De combinatie' },
      { key: 'verrassing', label: 'Verrassingsfactor' },
      { key: 'herhaalbaarheid', label: 'Wil je het herhalen?' },
    ],
    wordCount: [300, 450],
    interviewQuestions: [
      'Welk bier en welk gerecht?',
      'Hoe kwam je op de combinatie?',
      'Wat maakte het werken — of juist niet?',
      'Hoe makkelijk is het thuis na te maken?',
    ],
    draftInstructions:
      'Concreet en praktisch. Geef de lezer iets om vanavond mee te proberen.',
  },
  column: {
    label: 'Column',
    icon: 'Newspaper',
    color: 'var(--ink)',
    description: 'Mening, observatie, rebels.',
    scores: [],
    wordCount: [300, 500],
    interviewQuestions: [
      'Waar gaat de column over — wat irriteert, verrast of inspireert je?',
      'Wat is je standpunt in één zin?',
      'Wat wil je dat de lezer denkt of doet na het lezen?',
    ],
    draftInstructions:
      'Direct en persoonlijk. Geen opsommingen. Eindig met een stelling, niet een vraag.',
  },
  biertrip: {
    label: 'Biertrip',
    icon: 'MapPin',
    color: 'var(--copper)',
    description: "Bezoeken, regio's, events.",
    scores: [
      { key: 'beleving', label: 'Beleving' },
      { key: 'bereikbaarheid', label: 'Bereikbaarheid' },
      { key: 'prijs_kwaliteit', label: 'Prijs/kwaliteit' },
      { key: 'aanrader', label: 'Absolute aanrader?' },
    ],
    wordCount: [400, 650],
    interviewQuestions: [
      'Waar ging je naartoe?',
      'Wat was de aanleiding?',
      'Wat was het hoogtepunt?',
      'Wat had je beter kunnen weten op voorhand?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions:
      'Vertel het als een verhaal, niet als een reisverslag. Eén moment dat alles samenvat.',
  },
  seizoen: {
    label: 'Seizoen & sfeer',
    icon: 'Sun',
    color: 'var(--amber)',
    description: 'Bier gekoppeld aan een moment.',
    scores: [],
    wordCount: [200, 350],
    interviewQuestions: [
      'Welk seizoen of moment?',
      'Welk bier hoort daarbij voor jou?',
      'Wat maakt die combinatie kloppen?',
    ],
    draftInstructions:
      'Sfeervol en kort. Dit is een ode, geen review. Maximaal 350 woorden.',
  },
  missbaxel_bier: {
    label: "MissBaxel's bier",
    icon: 'Star',
    color: 'var(--hop)',
    description: 'Over haar eigen collabs.',
    scores: [
      { key: 'concept', label: 'Het concept' },
      { key: 'uitvoering', label: 'Uitvoering' },
      { key: 'originaliteit', label: 'Originaliteit' },
      { key: 'herkoopintentie', label: 'Wil je het opnieuw?' },
    ],
    wordCount: [400, 600],
    interviewQuestions: [
      'Over welk bier gaat het?',
      'Hoe ontstond het idee?',
      'Wat was de rol van de brouwerij?',
      'Wat zou je de volgende keer anders doen?',
      'Wat moet de lezer weten voor ze het proberen?',
    ],
    draftInstructions:
      'Eerlijk en persoonlijk — ook over wat niet perfect is. Dit is geen reclamefolder.',
  },
  bioshop: {
    label: 'Biershop',
    icon: 'ShoppingBag',
    color: 'var(--copper)',
    description: 'Reviews van bierwinkels.',
    scores: [
      { key: 'aanbod', label: 'Aanbod' },
      { key: 'kennis', label: 'Kennis & advies' },
      { key: 'sfeer', label: 'Sfeer' },
      { key: 'prijs_kwaliteit', label: 'Prijs/kwaliteit' },
      { key: 'algemeen', label: 'Algemeen' },
    ],
    wordCount: [300, 450],
    interviewQuestions: [
      'Welke shop, en waar?',
      'Wat trok je er naartoe?',
      'Wat viel je op — aanbod, mensen, sfeer?',
      'Kocht je iets specifieks?',
      'Voor wie is dit een aanrader?',
    ],
    draftInstructions:
      'Warm en concreet. De score staat apart — de tekst hoeft de cijfers niet te herhalen.',
  },
};

export const RUBRIC_KEYS = Object.keys(RUBRICS) as RubricKey[];

export function isRubricKey(v: string | null | undefined): v is RubricKey {
  return !!v && (RUBRIC_KEYS as string[]).includes(v);
}
