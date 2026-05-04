// Legacy compat re-exports (the project no longer features external breweries).
// We keep this file so older imports of `Beer` continue to work, and we provide
// `useBreweries` as a thin alias that returns an empty list.

export type { Beer } from './beers';
export { useBeers } from './beers';

import { useQuery } from '@tanstack/react-query';

/** Compatibility shim — there are no longer external breweries in this app. */
export function useBreweries() {
  return useQuery({
    queryKey: ['breweries-empty'],
    queryFn: async () => [] as any[],
  });
}
