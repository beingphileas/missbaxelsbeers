// Editorial rubrics (blog_posts.rubric) and people roles (people.role).
export const EDITORIAL_RUBRICS = [
  { key: 'tien_vragen', label: 'Tien vragen aan…' },
  { key: 'geproefd', label: 'Geproefd' },
  { key: 'aan_tafel', label: 'Aan tafel' },
  { key: 'rustig_gezegd', label: 'Rustig gezegd' },
  { key: 'samen_gebrouwen', label: 'Samen gebrouwen' },
] as const;

export type EditorialRubric = typeof EDITORIAL_RUBRICS[number]['key'];

export const rubricLabel = (k: string | null | undefined) =>
  EDITORIAL_RUBRICS.find(r => r.key === k)?.label ?? null;

export const ROLE_LABELS: Record<string, string> = {
  brewer: 'Brouwer',
  maltster: 'Mouter',
  hop_grower: 'Hopteler',
  label_designer: 'Etiketontwerper',
  bar_owner: 'Cafébaas',
  beer_shop: 'Bierhandel',
  other: 'Andere',
};

export const ROLE_KEYS = Object.keys(ROLE_LABELS);

export const INTERVIEW_CLOSING_LINE = 'Heb je al gegeten?';
