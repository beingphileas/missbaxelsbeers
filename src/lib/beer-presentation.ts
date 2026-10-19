export type SensoryBeer = {
  visual_notes?: string | null;
  aroma_notes?: string | null;
  taste_notes?: string | null;
  pairing_suggestion?: string | null;
  food_pairing?: string | null;
};

export function sensoryFields(beer: SensoryBeer) {
  return [
    { key: 'visual', label: 'Visueel', value: beer.visual_notes?.trim() },
    { key: 'aroma', label: 'Geur', value: beer.aroma_notes?.trim() },
    { key: 'taste', label: 'Smaak', value: beer.taste_notes?.trim() },
    { key: 'pairing', label: 'Pairing', value: beer.pairing_suggestion?.trim() || beer.food_pairing?.trim() },
  ].filter(field => Boolean(field.value));
}

export function hasEmptyBeerDetail(beer: {
  description?: string | null; brew_story?: string | null; marijke_idea?: string | null;
  image_url?: string | null; label_url?: string | null;
}) {
  return ![beer.description, beer.brew_story, beer.marijke_idea, beer.image_url, beer.label_url]
    .some(value => Boolean(value?.trim()));
}

export function populatedFilters<T extends { id: string }>(
  filters: readonly T[], hasItems: (id: string) => boolean,
) {
  return filters.filter(filter => filter.id === 'all' || hasItems(filter.id));
}