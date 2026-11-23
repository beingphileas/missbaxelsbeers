import type { Database } from '@/integrations/supabase/types';
export type AtlasBrewery = Database['public']['Tables']['breweries']['Row'];
export type AtlasLang = 'nl' | 'en';
export const ATLAS_SELECT = 'id,name,slug,municipality,location,province,type,brewery_category,established_year,website_url,address,lat,lng,atlas_visible,has_own_installation,visitable,facts_nl,facts_en,sources,flagship_beers,location_precision,missbaxel_status,missbaxel_note,missbaxel_note_en,first_seen,last_verified_at';
export const STAMPS: Record<string, [string,string]> = {
 samen_gebrouwen: ['Samen gebrouwen','Brewed together'], aan_de_toog: ['Aan de toog geweest','Met at the bar'],
 geproefd: ['Geproefd door MissBaxel','Tasted by MissBaxel'], nog_niet_geproefd: ['Nog niet geproefd door MissBaxel','Not tasted by MissBaxel yet'],
};
export const KINDS: Record<string,[string,string]> = {
 microbrouwerij:['Microbrouwerij','Microbrewery'],brewpub:['Brewpub','Brewpub'],bierfirma:['Bierfirma','Beer company'],steker:['Steker','Beer blender'],hoevebrouwerij:['Hoevebrouwerij','Farm brewery'],
};
export function stampLabel(status: string, lang: AtlasLang = 'nl') { return (STAMPS[status] || STAMPS.nog_niet_geproefd)[lang === 'en' ? 1 : 0]; }
export function breweryKind(b: Pick<AtlasBrewery,'type'|'brewery_category'>): string {
 const category = (b.brewery_category || '').toLowerCase();
 if (/brewpub/.test(category)) return 'brewpub';
 if (/farm|hoeve/.test(category)) return 'hoevebrouwerij';
 if (/steker|blend/.test(category) || b.type === 'Blender/Stekerij') return 'steker';
 if (/contract|beer.company|bierfirma/.test(category) || b.type === 'Contract brewer') return 'bierfirma';
 return 'microbrouwerij';
}
export const municipality = (b: Pick<AtlasBrewery,'municipality'|'location'>) => b.municipality || b.location || '';
export const safeUrl = (value: unknown): string | null => {
 if (typeof value !== 'string') return null;
 try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
};
export type AtlasFilters = { q: string; province: string; kind: string; visitable: boolean; own: boolean; status: string };
export function readAtlasFilters(params: URLSearchParams): AtlasFilters {
 return {q: params.get('q') || '', province: params.get('provincie') || '',kind: params.get('soort') || '',visitable:params.get('bezoek') === 'ja',own:params.get('installatie') === 'ja',status:params.get('status') || ''};
}
export function filterBreweries(rows: AtlasBrewery[], f: AtlasFilters): AtlasBrewery[] {
 const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const q = normalize(f.q.trim());
 return rows.filter(b => b.atlas_visible && (!q || normalize(`${b.name} ${municipality(b)}`).includes(q)) &&
 (!f.province || b.province === f.province) && (!f.kind || breweryKind(b) === f.kind) &&
 (!f.visitable || ['ja','op afspraak'].includes(b.visitable || '')) && (!f.own || b.has_own_installation === true) && (!f.status || b.missbaxel_status === f.status));
}
export function atlasCounts(rows: AtlasBrewery[]) {
 const visible = rows.filter(b => b.atlas_visible);
 return { breweries:visible.length, provinces:new Set(visible.map(b=>b.province).filter(p=>p && p.toLowerCase() !== 'onbekend')).size, tasted:visible.filter(b=>b.missbaxel_status !== 'nog_niet_geproefd').length };
}

export function provinceLabel(province:string,lang:AtlasLang){
 const english:Record<string,string>={'West-Vlaanderen':'West Flanders','Oost-Vlaanderen':'East Flanders','Vlaams-Brabant':'Flemish Brabant','Waals-Brabant':'Walloon Brabant','Antwerpen':'Antwerp','Luik':'Liège','Henegouwen':'Hainaut','Namen':'Namur','Luxemburg':'Luxembourg','Brussel':'Brussels','Onbekend':'Unknown'};
 return lang==='en'?(english[province]||province):province;
}
