import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type {AtlasBrewery,AtlasLang} from '@/lib/atlas';
const Map=lazy(()=>import('./AtlasMap'));
export default function LazyAtlasMap(props:{rows:AtlasBrewery[];lang:AtlasLang;compact?:boolean}) {
 const ref=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false);
 useEffect(()=>{if (!ref.current) return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'200px'});observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const loading=<div className={`atlas-map ${props.compact?'compact':''} bg-muted flex items-center justify-center`} role="status">{props.lang==='nl'?'Kaart laden…':'Loading map…'}</div>;
 return <div ref={ref}>{visible?<Suspense fallback={loading}><Map {...props}/></Suspense>:loading}</div>;
}
