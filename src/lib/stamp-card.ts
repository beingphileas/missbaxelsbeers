export const STAMP_STORAGE_KEY='missbaxels_visited_breweries.v1';
export function parseVisits(value:string|null):string[]{
 try{const ids=JSON.parse(value||'[]');return Array.isArray(ids)?Array.from(new Set(ids.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=100))):[];}catch{return [];}
}
export function toggleVisit(ids:readonly string[],id:string):string[]{return ids.includes(id)?ids.filter(i=>i!==id):[...ids,id];}
export function filterVisits<T extends {id:string}>(rows:T[],ids:readonly string[],mode:string):T[]{return mode==='bezocht'?rows.filter(b=>ids.includes(b.id)):mode==='nog_niet'?rows.filter(b=>!ids.includes(b.id)):rows;}
export function visitCount(rows:{id:string}[],ids:readonly string[]){return rows.filter(b=>ids.includes(b.id)).length;}
export function createStampStore(storage?:Pick<Storage,'getItem'|'setItem'>){
 let current:readonly string[]=[];try{current=parseVisits(storage?.getItem(STAMP_STORAGE_KEY)||null);}catch{/* memory fallback */}
 const listeners=new Set<()=>void>();
 const emit=()=>listeners.forEach(listener=>listener());
 return {get:()=>current,subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},toggle:(id:string)=>{current=toggleVisit(current,id);try{storage?.setItem(STAMP_STORAGE_KEY,JSON.stringify(current));}catch{/* retain this session in memory */}emit();},restore:(value:string|null)=>{current=parseVisits(value);emit();}};
}
