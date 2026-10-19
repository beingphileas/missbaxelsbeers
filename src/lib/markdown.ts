/**
 * Repairs emphasis markers that markdown ignores because of stray spaces,
 * e.g. "*tekst *" or "** EN VERSION **". Display only; stored text is untouched.
 * List bullets ("* item" at line start) are left alone.
 */
export function normalizeMarkdownEmphasis(src: string): string {
  if (!src) return src;
  return src
    .split('\n')
    .map(line => {
      const bullet = line.match(/^(\s*[*+-]\s+)/);
      const prefix = bullet ? bullet[1] : '';
      let rest = line.slice(prefix.length);
      rest = rest.replace(/(\*\*|\*)[ \t]*([^*\n]*?\S)[ \t]*\1(?!\*)/g, (_m, mark, inner) => `${mark}${inner.trim()}${mark}`);
      return prefix + rest;
    })
    .join('\n');
}
