import { describe, it, expect } from 'vitest';
import { normalizeMarkdownEmphasis as n } from './markdown';

describe('normalizeMarkdownEmphasis', () => {
  it('fixes a space before the closing asterisk', () => {
    expect(n('*De naam Vie slaat op het leven. *')).toBe('*De naam Vie slaat op het leven.*');
  });
  it('fixes spaced bold markers', () => {
    expect(n('** EN VERSION **')).toBe('**EN VERSION**');
  });
  it('keeps list bullets intact', () => {
    expect(n('* item een\n* item twee')).toBe('* item een\n* item twee');
  });
  it('leaves correct emphasis unchanged', () => {
    expect(n('Een *mooi* en **sterk** bier')).toBe('Een *mooi* en **sterk** bier');
  });
});
