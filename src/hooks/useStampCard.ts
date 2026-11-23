import {useSyncExternalStore} from 'react';
import {createStampStore,STAMP_STORAGE_KEY} from '@/lib/stamp-card';
let storage:Storage|undefined;try{storage=typeof window==='undefined'?undefined:window.localStorage;}catch{/* memory only */}
const store=createStampStore(storage);
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===STAMP_STORAGE_KEY)store.restore(event.newValue);});
export function useStampCard(){const visited=useSyncExternalStore(store.subscribe,store.get,store.get);return {visited,toggle:store.toggle};}
