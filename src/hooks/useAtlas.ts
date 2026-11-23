import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ATLAS_SELECT, type AtlasBrewery } from '@/lib/atlas';
export async function loadAtlas() {
 const rows: AtlasBrewery[] = [];
 for (let start = 0;; start += 1000) {
  const {data,error} = await supabase.from('breweries').select(ATLAS_SELECT).eq('atlas_visible',true).order('name').range(start,start+999);
  if (error) throw error;
  rows.push(...(data || []) as AtlasBrewery[]);
  if (!data || data.length < 1000) return rows;
 }
}
export function useAtlas() { return useQuery({queryKey:['atlas'],queryFn:loadAtlas,staleTime:60000}); }
