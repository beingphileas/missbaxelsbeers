import {useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useLanguage} from '@/hooks/useLanguage';
import {useAtlas} from '@/hooks/useAtlas';
import {filterBreweries,readAtlasFilters,KINDS,STAMPS,stampLabel,provinceLabel} from '@/lib/atlas';
import {Button} from '@/components/ui/button';
import AtlasLanguage from '@/components/atlas/AtlasLanguage';
import SEOHead from '@/components/SEOHead';
import {AtlasCounters,BreweryCard} from '@/components/atlas/AtlasCards';
import LazyAtlasMap from '@/components/atlas/LazyAtlasMap';
import BrewerTipForm from '@/components/atlas/BrewerTipForm';
import '@/components/atlas/atlas.css';
export default function Brouwers(){
 const {lang}=useLanguage();const en=lang==='en';const [params,setParams]=useSearchParams();const {data=[],isLoading,isError,refetch}=useAtlas();
 const filters=readAtlasFilters(params);const filtered=useMemo(()=>filterBreweries(data,filters),[data,params.toString()]);
 const recent=useMemo(()=>[...data].sort((a,b)=>b.first_seen.localeCompare(a.first_seen)||a.name.localeCompare(b.name)).slice(0,6),[data]);
 function update(key:string,value:string){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);setParams(next,{replace:true});}
 const chip=(key:string,value:string,label:string,active:boolean)=><Button key={value} size="sm" className="rounded-full whitespace-normal h-auto min-h-9 text-left" variant={active?'default':'outline'} aria-pressed={active} onClick={()=>update(key,active?'':value)}>{label}</Button>;
 return <div className="atlas bg-background pb-16">
 <SEOHead title={en?'The atlas of small breweries':'De atlas van de kleine brouwers'} description={en?'Small independent Belgian breweries on one map, with facts, sources and MissBaxel’s own notes.':'Kleine onafhankelijke Belgische brouwers op één kaart, met feiten, bronnen en MissBaxels eigen woorden.'} url="/brouwers" locale={en?'en':'nl_BE'}/>
 <section className="max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-10"><div className="flex justify-end mb-6"><AtlasLanguage/></div><h1 className="text-4xl md:text-5xl leading-tight max-w-3xl">{en?'The atlas of small breweries':'De atlas van de kleine brouwers'}</h1><p className="atlas-lead text-lg leading-relaxed mt-6 mb-8 max-w-3xl">{en?'All small, independent Belgian breweries on one map. The facts are checked, the opinions are mine, and if I have not tasted yet, I say so.':'Alle kleine, onafhankelijke Belgische brouwers op één kaart. De feiten zijn nagekeken, de mening is van mij, en waar ik nog niet geproefd heb staat dat er gewoon bij.'}</p>{!isLoading&&!isError&&<AtlasCounters rows={data}/>}</section>
 <section className="max-w-6xl mx-auto px-5 md:px-8" aria-label={en?'Brewery filters':'Brouwerijfilters'}>
 <label className="block mb-6">{en?'Search by name or municipality':'Zoek op naam of gemeente'}<input type="search" value={filters.q} onChange={e=>update('q',e.target.value)} className="block mt-2 w-full max-w-lg border border-border rounded-lg px-4 py-3 bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"/></label>
 <fieldset className="mb-4"><legend className="text-sm text-muted-foreground mb-2">{en?'Province':'Provincie'}</legend><div className="flex flex-wrap gap-2">{Array.from(new Set(data.map(b=>b.province).filter(Boolean))).sort().map(p=>chip('provincie',p,provinceLabel(p,lang),filters.province===p))}</div></fieldset>
 <fieldset className="mb-4"><legend className="text-sm text-muted-foreground mb-2">{en?'Type':'Soort'}</legend><div className="flex flex-wrap gap-2">{Object.entries(KINDS).map(([k,labels])=>chip('soort',k,labels[en?1:0],filters.kind===k))}</div></fieldset>
 <fieldset className="mb-4"><legend className="text-sm text-muted-foreground mb-2">MissBaxel</legend><div className="flex flex-wrap gap-2">{Object.keys(STAMPS).map(k=>chip('status',k,stampLabel(k,lang),filters.status===k))}</div></fieldset>
 <div className="flex flex-wrap gap-2 mb-6">{chip('bezoek','ja',en?'Open to visitors':'Te bezoeken',filters.visitable)}{chip('installatie','ja',en?'Own installation':'Eigen installatie',filters.own)}{params.size>0&&<Button variant="ghost" onClick={()=>setParams({})}>{en?'Clear filters':'Wis filters'}</Button>}</div>
 {isLoading?<p role="status" className="py-16">{en?'Loading breweries…':'Brouwers laden…'}</p>:isError?<div role="alert" className="py-10"><p>{en?'The atlas could not be loaded.':'De atlas kon niet geladen worden.'}</p><Button onClick={()=>refetch()}>{en?'Try again':'Probeer opnieuw'}</Button></div>:<>
 <LazyAtlasMap rows={filtered} lang={lang}/><div aria-live="polite" className="my-6 text-muted-foreground">{filtered.length} {en?'breweries':'brouwers'}</div>
 {filtered.length?<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(b=><BreweryCard key={b.id} brewery={b}/>)}</div>:<p className="py-10">{en?'No breweries match these filters.':'Met deze filters vind ik geen brouwers.'}</p>}
 </>}
 </section>
 {recent.length>0&&<section className="bg-muted/40 mt-14 py-12"><div className="max-w-6xl mx-auto px-5 md:px-8"><h2 className="text-3xl mb-6">{en?'Just discovered':'Net ontdekt'}</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{recent.map(b=><BreweryCard key={b.id} brewery={b}/>)}</div></div></section>}
 <section id="tip" className="max-w-6xl mx-auto px-5 md:px-8 pt-14 scroll-mt-24"><h2 className="text-3xl mb-6">{en?'Am I missing a brewer?':'Mis ik een brouwer?'}</h2><BrewerTipForm/></section>
 </div>;
}
