import { describe, expect, it } from 'vitest';
import { rubricLabel } from './editorial';

describe('editorial rubric labels', () => {
  it.each([
    ['tien_vragen', 'Aan de toog met…'],
    ['geproefd', 'Geproefd'],
    ['aan_tafel', 'Aan tafel'],
    ['rustig_gezegd', 'Rustig gezegd'],
    ['samen_gebrouwen', 'Samen gebrouwen'],
  ])('maps %s to its readable label', (key, label) => {
    expect(rubricLabel(key)).toBe(label);
    expect(rubricLabel(key.toUpperCase())).toBe(label);
  });

  it('does not expose missing or unknown database keys', () => {
    expect(rubricLabel(null)).toBeNull();
    expect(rubricLabel(undefined)).toBeNull();
    expect(rubricLabel('unknown_rubric')).toBeNull();
  });
});