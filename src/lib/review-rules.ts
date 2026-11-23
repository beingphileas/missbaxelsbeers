export const PUBLIC_BEER_STATUSES = ['current', 'coming_soon', 'sold_out', 'archive'] as const;
export function isPublicBeer(beer: {hide_name?: boolean | null; lifecycle_status?: string | null}) {
 return beer.hide_name !== true && PUBLIC_BEER_STATUSES.some(status => status === beer.lifecycle_status);
}
export function canPublishPost(texts: (string | null | undefined)[]) {
 return !texts.some(text => text?.includes('[Marijke:'));
}
export const ATLAS_PROVINCES = ['Antwerpen','Brussel','Henegouwen','Limburg','Luik','Luxemburg','Namen','Oost-Vlaanderen','Vlaams-Brabant','Waals-Brabant','West-Vlaanderen'] as const;
export function recentBreweries<T extends {first_seen:string;name:string}>(rows:T[], now = new Date()) {
 const today = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
 return rows.filter(b => {const date=Date.parse(b.first_seen);return Number.isFinite(date)&&date>=today-60*86400000&&date<=today;})
 .sort((a,b)=>b.first_seen.localeCompare(a.first_seen)||a.name.localeCompare(b.name)).slice(0,6);
}
