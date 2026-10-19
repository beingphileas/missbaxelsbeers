# Project decisions

- Keep `/beers` as the canonical beer overview and redirect `/bieren` to it, so Dutch editorial links work without changing the established navigation or detail URLs.
- Use `EDITORIAL_RUBRICS` and `rubricLabel` from `src/lib/editorial.ts` for all editorial category labels, so database keys never become public labels and filters and cards remain consistent.
- Keep beer slugs as canonical detail URLs with UUID fallback redirects; use existing `taste_notes` and pairing prose plus `visual_notes` and `aroma_notes` for sensory narratives, so tags stay separate and existing content is preserved.