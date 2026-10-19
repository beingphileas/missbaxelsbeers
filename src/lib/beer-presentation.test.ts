import { describe, expect, it } from 'vitest';
import { sensoryFields, hasEmptyBeerDetail, populatedFilters } from './beer-presentation';

describe('beer presentation rules', () => {
  it('uses the empty state only without narrative and image', () => {
    expect(hasEmptyBeerDetail({ description: ' ', image_url: null })).toBe(true);
    expect(hasEmptyBeerDetail({ description: 'Existing description' })).toBe(false);
    expect(hasEmptyBeerDetail({ label_url: '/label.jpg' })).toBe(false);
  });
  it('hides the sensory section when all four fields are empty', () => {
    expect(sensoryFields({ visual_notes: ' ', aroma_notes: null })).toHaveLength(0);
  });
  it('returns only filled sensory fields and preserves their order', () => {
    expect(sensoryFields({ visual_notes: 'Golden', taste_notes: 'Bitter', food_pairing: 'Cheese' })
      .map(field => field.key)).toEqual(['visual', 'taste', 'pairing']);
  });
  it('uses the existing pairing fallback without duplicating it', () => {
    const fields = sensoryFields({ pairing_suggestion: 'Stew', food_pairing: 'Cheese' });
    expect(fields).toHaveLength(1);
    expect(fields[0]?.value).toBe('Stew');
  });
  it('hides categories with zero items but retains the all filter', () => {
    expect(populatedFilters([{ id: 'all' }, { id: 'sour' }, { id: 'tripel' }], id => id === 'tripel')
      .map(filter => filter.id)).toEqual(['all', 'tripel']);
  });
});