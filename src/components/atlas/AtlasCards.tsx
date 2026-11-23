import { Link } from 'react-router-dom';
import { atlasCounts, breweryKind, KINDS, provinceLabel, municipality, stampLabel, type AtlasBrewery } from '@/lib/atlas';
import { useLanguage } from '@/hooks/useLanguage';
import VisitButton from './VisitButton';
import {atlasPath} from '@/lib/atlas-navigation';
export function AtlasCounters({rows}:{rows:AtlasBrewery[]}) {
 const {lang}=useLanguage();const c=atlasCounts(rows);
 return <dl className="grid grid-cols-3 gap-3 py-6 border-y border-border">
 {[[c.breweries,lang==='nl'?'brouwers':'breweries'],[c.provinces,lang==='nl'?'provincies':'provinces'],[c.tasted,lang==='nl'?'al geproefd':'already tasted']].map(([n,label])=><div key={label} className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-3xl mt-1 font-semibold tabular-nums">{n}</dd></div>)}
 </dl>;
}
export function BreweryCard({brewery:b}:{brewery:AtlasBrewery}) {
 const {lang}=useLanguage();
 return <article><Link to={atlasPath(lang,b.slug)} className="atlas-card group block rounded-lg bg-card p-6 no-underline border border-border transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
 <p className="text-sm text-muted-foreground">{[municipality(b),provinceLabel(b.province,lang)].filter(Boolean).join(', ')}</p>
 <h3 className="text-xl mt-2 font-display break-words group-hover:text-primary">{b.name}</h3>
 <p className="text-sm mt-3 text-muted-foreground">{KINDS[breweryKind(b)][lang==='en'?1:0]}{b.established_year?` · ${b.established_year}`:''}</p>
 <span className={`inline-block mt-5 text-xs rounded-full px-3 py-1 ${b.missbaxel_status==='nog_niet_geproefd'?'bg-muted text-muted-foreground':'bg-primary text-primary-foreground'}`}>{stampLabel(b.missbaxel_status,lang)}</span>
 </Link><div className="px-6 pt-3 pb-5"><VisitButton id={b.id} name={b.name}/></div></article>;
}
