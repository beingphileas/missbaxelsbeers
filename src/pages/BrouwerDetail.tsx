import {useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Helmet} from 'react-helmet-async';
import {supabase} from '@/integrations/supabase/client';
import {useLanguage} from '@/hooks/useLanguage';
import {ATLAS_SELECT,breweryKind,KINDS,provinceLabel,municipality,safeUrl,stampLabel,type AtlasBrewery} from '@/lib/atlas';
import {SITE_URL} from '@/lib/seo-routes';
import VisitButton from '@/components/atlas/VisitButton';
import AtlasLanguage from '@/components/atlas/AtlasLanguage';
import SEOHead from '@/components/SEOHead';
import {Button} from '@/components/ui/button';
import NotFound from './NotFound';
import LazyAtlasMap from '@/components/atlas/LazyAtlasMap';
import BrewerTipForm from '@/components/atlas/BrewerTipForm';
import CollectionBeerCard from '@/components/atlas/CollectionBeerCard';
import {PUBLIC_BEER_STATUSES} from '@/lib/review-rules';
import MapLegend from '@/components/atlas/MapLegend';
import {useEffect} from 'react';
import {atlasPath} from '@/lib/atlas-navigation';
import '@/components/atlas/atlas.css';
async function loadDetail(slug:string){
 const {data:brewery,error}=await supabase.from('breweries').select(ATLAS_SELECT).eq('slug',slug).eq('atlas_visible',true).maybeSingle();
 if(error)throw error;if(!brewery)return null;const b=brewery as AtlasBrewery;
 const beerLinks:string[]=[]; const postLinks:string[]=[];
 for(let start=0;;start+=1000){const {data,error}=await supabase.from('beer_breweries').select('beer_id').eq('brewery_id',b.id).range(start,start+999);if(error)throw error;beerLinks.push(...(data||[]).map(l=>l.beer_id));if(!data||data.length<1000)break;}
 for(let start=0;;start+=1000){const {data,error}=await supabase.from('blog_post_breweries').select('blog_post_id').eq('brewery_id',b.id).range(start,start+999);if(error)throw error;postLinks.push(...(data||[]).map(l=>l.blog_post_id));if(!data||data.length<1000)break;}
 const beers=[];const posts=[];
 for(let start=0;;start+=1000){let q=supabase.from('beers').select('id,slug,name,style,image_url,label_url').or('hide_name.is.null,hide_name.eq.false').in('lifecycle_status',[...PUBLIC_BEER_STATUSES]).order('name').range(start,start+999);q=beerLinks.length?q.or(`brewery_id.eq.${b.id},id.in.(${beerLinks.join(',')})`):q.eq('brewery_id',b.id);const {data,error}=await q;if(error)throw error;beers.push(...(data||[]));if(!data||data.length<1000)break;}
 for(let start=0;;start+=1000){let q=supabase.from('blog_posts').select('id,slug,title,title_en,content_en,excerpt,excerpt_en,cover_image_url').eq('status','published').order('date',{ascending:false}).range(start,start+999);q=postLinks.length?q.or(`brewery_id.eq.${b.id},id.in.(${postLinks.join(',')})`):q.eq('brewery_id',b.id);const {data,error}=await q;if(error)throw error;posts.push(...(data||[]));if(!data||data.length<1000)break;}
 return {b,beers,posts};
}
export default function BrouwerDetail({routeLang}:{routeLang?:'en'}={}){
 const {slug=''}=useParams();const {lang:storedLang,setLang}=useLanguage();const lang=routeLang||storedLang;useEffect(()=>{if(routeLang)setLang(routeLang);},[routeLang]);const en=lang==='en';const [correction,setCorrection]=useState(false);
 const {data,isLoading,isError,refetch}=useQuery({queryKey:['atlas-detail',slug],queryFn:()=>loadDetail(slug)});
 if(isLoading)return <div className="atlas max-w-6xl mx-auto px-5 py-16" role="status">{en?'Loading brewery…':'Brouwerij laden…'}</div>;
 if(isError)return <div className="atlas max-w-6xl mx-auto px-5 py-16" role="alert"><p>{en?'The brewery could not be loaded.':'De brouwerij kon niet geladen worden.'}</p><Button onClick={()=>refetch()}>{en?'Try again':'Probeer opnieuw'}</Button></div>;
 if(!data)return <NotFound/>;
 const {b,beers,posts}=data;const facts=en?b.facts_en:b.facts_nl;const note=en?b.missbaxel_note_en:b.missbaxel_note;
 const sources=Array.isArray(b.sources)?b.sources.map(safeUrl).filter((u):u is string=>Boolean(u)):[];
 const website=safeUrl(b.website_url);const url=`${SITE_URL}${en?'/en':''}/brouwers/${b.slug}`;
 const description=`${b.name}, ${municipality(b)}${b.province?`, ${b.province}`:''}. ${en?'Facts and MissBaxel’s own notes.':'Feiten en MissBaxels eigen woorden.'}`;
 const jsonLd=[{'@context':'https://schema.org','@type':'Brewery',name:b.name,url,address:{'@type':'PostalAddress',streetAddress:b.location_precision==='adres'?b.address||undefined:undefined,addressLocality:municipality(b)||undefined,addressRegion:b.province,addressCountry:'BE'},sameAs:website||undefined},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE_URL+'/'},{'@type':'ListItem',position:2,name:'Atlas',item:SITE_URL+atlasPath(lang)},{'@type':'ListItem',position:3,name:b.name,item:url}]}];
 const visit=en?({ja:'Yes','op afspraak':'By appointment',nee:'No',onbekend:'Unknown'}[b.visitable||'onbekend']||'Unknown'):(b.visitable||'onbekend');
 return <div className="atlas bg-background pb-16"><SEOHead title={b.name} description={description} url={`${en?'/en':''}/brouwers/${b.slug}`} locale={en?'en':'nl_BE'}/><Helmet><link rel="alternate" hrefLang="nl-BE" href={`${SITE_URL}/brouwers/${b.slug}`}/><link rel="alternate" hrefLang="en" href={`${SITE_URL}/en/brouwers/${b.slug}`}/><link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/brouwers/${b.slug}`}/><script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g,'\\u003c')}</script></Helmet>
 <header className="max-w-6xl mx-auto px-5 md:px-8 pt-12 pb-10"><div className="flex justify-end mb-5"><AtlasLanguage/></div><Link to={atlasPath(lang)} className="text-primary">{en?'Back to the atlas':'Terug naar de atlas'}</Link><h1 className="text-4xl md:text-5xl mt-6 break-words">{b.name}</h1><p className="mt-4 text-muted-foreground">{[municipality(b),provinceLabel(b.province,lang),KINDS[breweryKind(b)][en?1:0],b.established_year].filter(Boolean).join(' · ')}</p><p className="mt-3 text-primary">{stampLabel(b.missbaxel_status,lang)}</p><div className="mt-4"><VisitButton id={b.id} name={b.name}/></div>{website&&<a href={website} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 underline text-primary">{en?'Brewery website':'Website van de brouwerij'}</a>}</header>
 <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 border-t border-border"><h2 className="text-3xl mb-6">{en?'The facts':'De feiten'}</h2>{facts&&<p className="whitespace-pre-wrap leading-relaxed mb-6 max-w-3xl">{facts}</p>}<dl className="grid sm:grid-cols-2 gap-5 mb-6"><div><dt className="text-sm text-muted-foreground">{en?'Own installation':'Eigen installatie'}</dt><dd>{b.has_own_installation===null?(en?'Unknown':'Onbekend'):b.has_own_installation?(en?'Yes':'Ja'):(en?'No':'Nee')}</dd></div><div><dt className="text-sm text-muted-foreground">{en?'Open to visitors':'Te bezoeken'}</dt><dd>{visit}</dd></div>{b.flagship_beers.length>0&&<div><dt className="text-sm text-muted-foreground">{en?'Best-known beers':'Bekendste bieren'}</dt><dd>{b.flagship_beers.join(', ')}</dd></div>}<div><dt className="text-sm text-muted-foreground">{en?'Last checked':'Laatst nagekeken'}</dt><dd>{b.last_verified_at?new Date(b.last_verified_at).toLocaleDateString(en?'en-GB':'nl-BE'):(en?'Not checked yet':'Nog niet nagekeken')}</dd></div></dl>{sources.length>0&&<details><summary className="cursor-pointer text-primary">{en?'Sources':'Bronnen'} ({sources.length})</summary><ul className="mt-3 space-y-2">{sources.map((s,i)=><li key={`${s}-${i}`}><a href={s} target="_blank" rel="nofollow noopener noreferrer" className="underline break-all">{s}</a></li>)}</ul></details>}</section>
 <section className="bg-muted/40 py-10 my-6"><div className="max-w-6xl mx-auto px-5 md:px-8"><h2 className="text-3xl mb-6">{en?'What I think':'Wat ik ervan vind'}</h2>{note?<><p className="atlas-lead text-lg leading-relaxed whitespace-pre-wrap max-w-3xl">{note}</p><p className="mt-4">MissBaxel</p></>:<><p>{en?'I have not tasted here yet.':'Hier heb ik nog niet geproefd.'}</p><Link to={`${atlasPath(lang)}#tip`} className="text-primary underline inline-block mt-3">{en?'Tell me where to start':'Zeg me waar ik moet beginnen'}</Link></>}</div></section>
 {beers.length>0&&<section className="max-w-6xl mx-auto px-5 md:px-8 py-8"><h2 className="text-3xl mb-6">{en?'Beers in our collection':'Bieren uit onze collectie'}</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{beers.map(beer=><CollectionBeerCard key={beer.id} beer={beer}/>)}</div></section>}
 {posts.length>0&&<section className="max-w-6xl mx-auto px-5 md:px-8 py-8"><h2 className="text-3xl mb-6">{en?'Stories':'Verhalen'}</h2><div className="grid md:grid-cols-3 gap-5">{posts.map(p=><Link key={p.id} to={`${en&&p.content_en?'/en':''}/verhalen/${p.slug}`} className="bg-card rounded-lg overflow-hidden border border-border no-underline">{p.cover_image_url&&<img src={p.cover_image_url} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover"/>}<h3 className="p-5 font-display text-xl">{en&&p.title_en?p.title_en:p.title}</h3></Link>)}</div></section>}
 <section className="max-w-6xl mx-auto px-5 md:px-8 py-8"><LazyAtlasMap rows={[b]} lang={lang} compact/><MapLegend/>{b.location_precision==='gemeente'&&<p className="text-sm text-muted-foreground mt-2">{en?'Approximate location':'Ligging bij benadering'}</p>}<Button variant="link" className="px-0 mt-5" aria-expanded={correction} onClick={()=>setCorrection(v=>!v)}>{en?'Is something incorrect?':'Klopt er iets niet?'}</Button>{correction&&<div className="mt-5"><BrewerTipForm brewery={{id:b.id,name:b.name,municipality:municipality(b)}}/></div>}</section>
 </div>;
}
