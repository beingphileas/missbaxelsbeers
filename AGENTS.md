# Project decisions

- Keep `/beers` as the canonical beer overview and redirect `/bieren` to it, so Dutch editorial links work without changing the established navigation or detail URLs.
- Use `EDITORIAL_RUBRICS` and `rubricLabel` from `src/lib/editorial.ts` for all editorial category labels, so database keys never become public labels and filters and cards remain consistent.