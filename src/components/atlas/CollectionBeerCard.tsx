import {Link} from 'react-router-dom';
import './atlas.css';
export type CollectionBeer={id:string;slug:string|null;name:string;style?:string|null;image_url:string|null;label_url:string|null;hide_name?:boolean|null;lifecycle_status?:string|null;breweries?:string[]};
/** The existing released-collab card, also used for brewery collections. */
export default function CollectionBeerCard({beer:b,variant='atlas'}:{beer:CollectionBeer;variant?:'atlas'|'existing'}) {
 const image=b.label_url||b.image_url;
 if(variant==='existing'){
  const badge=b.lifecycle_status==='coming_soon'?'Binnenkort':b.lifecycle_status==='sold_out'?'Uitverkocht':null;
  return <Link to={`/beers/${b.slug||b.id}`} className="collection-beer shrink-0 w-[240px] block" style={{background:'var(--surface)',borderRadius:20,boxShadow:'var(--atlas-beer-shadow)',overflow:'hidden'}}>
   <div className="relative" style={{aspectRatio:'4 / 5',background:'var(--atlas-beer-image)'}}>{image&&<img src={image} alt={b.name} loading="lazy" className="w-full h-full object-cover"/>}{badge&&<span className="absolute top-3 left-3" style={{background:'var(--copper)',color:'var(--surface)',fontFamily:"'Outfit', 'Inter', system-ui, sans-serif",fontSize:12,fontWeight:600,padding:'4px 12px',borderRadius:9999}}>{badge}</span>}</div>
   <div style={{padding:16}}><p style={{fontFamily:"'Outfit', 'Inter', system-ui, sans-serif",fontWeight:700,fontSize:18,color:'var(--ink)',margin:0}}>{b.hide_name?'???':b.name}</p>{Boolean(b.breweries?.length)&&<p style={{fontSize:13,color:'var(--atlas-beer-muted)',marginTop:4}}>{b.breweries?.join(' × ')}</p>}</div>
  </Link>;
 }
 return <Link to={`/beers/${b.slug||b.id}`} className="block overflow-hidden rounded-lg bg-card border border-border no-underline group"><div className="aspect-[4/5] bg-muted flex items-center justify-center p-5">{image&&<img src={image} alt={b.name} loading="lazy" className="max-h-full w-full object-contain transition-transform motion-reduce:transition-none group-hover:scale-105"/>}</div><div className="p-4"><h3 className="font-display text-lg">{b.name}</h3>{b.style&&<p className="text-sm text-muted-foreground mt-1">{b.style}</p>}</div></Link>;
}
