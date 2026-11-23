import {describe,it,expect} from 'vitest';
import {createStampStore,parseVisits,toggleVisit,filterVisits,visitCount,STAMP_STORAGE_KEY} from './stamp-card';
describe('personal stamp card',()=>{
 it('toggles a visit on and off',()=>{expect(toggleVisit([],'brewery-a')).toEqual(['brewery-a']);expect(toggleVisit(['brewery-a'],'brewery-a')).toEqual([]);});
 it('deduplicates storage and ignores invalid entries',()=>expect(parseVisits('["a","a",null,42,""]')).toEqual(['a']));
 it('recovers corrupt storage as an empty card',()=>expect(parseVisits('invalid')).toEqual([]));
 it('filters visited and still-to-visit independently of MissBaxel status',()=>{const rows=[{id:'a',missbaxel_status:'nog_niet_geproefd'},{id:'b',missbaxel_status:'samen_gebrouwen'}];expect(filterVisits(rows,['a'],'bezocht')).toEqual([rows[0]]);expect(filterVisits(rows,['a'],'nog_niet')).toEqual([rows[1]]);expect(rows[0].missbaxel_status).toBe('nog_niet_geproefd');});
 it('counts only breweries still in the atlas',()=>expect(visitCount([{id:'a'},{id:'b'}],['a','gone'])).toBe(1));
 it('stores visits and restores them on the next visit',()=>{const saved=new Map<string,string>();const storage={getItem:(key:string)=>saved.get(key)||null,setItem:(key:string,value:string)=>{saved.set(key,value);}};const store=createStampStore(storage);store.toggle('a');expect(saved.get(STAMP_STORAGE_KEY)).toBe('["a"]');expect(createStampStore(storage).get()).toEqual(['a']);});
 it('retains visits in memory when reading and writing localStorage fail',()=>{const store=createStampStore({getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});store.toggle('a');expect(store.get()).toEqual(['a']);store.toggle('a');expect(store.get()).toEqual([]);});
 it('updates subscribers and handles a storage event from another tab',()=>{const store=createStampStore();let events=0;const unsub=store.subscribe(()=>events++);store.restore('["a"]');expect(store.get()).toEqual(['a']);expect(events).toBe(1);unsub();store.toggle('b');expect(events).toBe(1);});
});
