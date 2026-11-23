# Project decisions

- Keep `/beers` as the canonical beer overview and redirect `/bieren` to it, so Dutch editorial links work without changing the established navigation or detail URLs.
- Use `EDITORIAL_RUBRICS` and `rubricLabel` from `src/lib/editorial.ts` for all editorial category labels, so database keys never become public labels and filters and cards remain consistent.
- Keep beer slugs as canonical detail URLs with UUID fallback redirects; use existing `taste_notes` and pairing prose plus `visual_notes` and `aroma_notes` for sensory narratives, so tags stay separate and existing content is preserved.- Generate crawler HTML, sitemap.xml and robots.txt at build time via `scripts/prerender.ts` (Vite plugin) with titles/routes from `src/lib/seo-routes.ts`, because the Vite SPA has no SSR; head tags carry `data-rh` so Helmet replaces instead of duplicating.

- Keep atlas facts and personal notes in separate explicit NL/EN fields, never derive opinions from legacy descriptions; this preserves authorship.
- Use the shared atlas filter/status helpers and paginated queries for every atlas view; counts and maps must use the same visible dataset.
- Load atlas Leaflet maps lazily with OpenStreetMap tiles and keyboard-focusable markers, retaining the ordinary list as an accessible alternative.
- Accept public brewer tips only through the rate-limited edge function with bounded inputs, honeypot and visible-brewery validation; reading and processing tips requires the server-validated admin role.
- Keep interview invitations admin-only in the Data API; the token edge function exposes a minimal snapshot, serializes saves with version checks, and locks submitted answers to read-only.
- Generate interview drafts atomically under a server-checked admin role using the original answer text; never publish or change brewery tasting status during conversion, and require an explicit confirmed editor status change for publication, blocked server-side while the Marijke placeholder remains.
- Keep personal brewery visits in a shared localStorage-backed store with memory fallback, separate from MissBaxel status; no account or server writes are involved.
- Do not send personal interview token URLs to application analytics or crawler indexes; use noindex, no-referrer, and no-store for token pages and responses.

- Keep Leaflet map instances stable during visitor stamp changes and update only affected marker icons; gesture handling protects one-finger page scrolling.
- Public atlas beer links and status backfills use named beers in the shared public lifecycle states; brewery province remains independent of region.
- Personal interview access expires after the stored deadline and closes after processing; only admins can extend deadlines.
- Atlas NL/EN routes share slugs and data fields with build-time prerender and hreflang pairs, preserving the existing language store.
- Use the shared atlas path helper for atlas navigation and retry interview version conflicts only when the saved answer snapshot is unchanged, so language and concurrent answers are preserved.
