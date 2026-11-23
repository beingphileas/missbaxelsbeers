import { Link } from 'react-router-dom';
import {useLanguage} from '@/hooks/useLanguage';
import {useAtlas} from '@/hooks/useAtlas';
import {Button} from '@/components/ui/button';
import {AtlasCounters} from './AtlasCards';
import {atlasPath} from '@/lib/atlas-navigation';
import './atlas.css';
export default function HomeAtlas(){const {lang}=useLanguage();const {data=[],isLoading,isError}=useAtlas();return <section className="atlas bg-muted/40 px-5 md:px-12 py-14"><div className="max-w-[1200px] mx-auto"><h2 className="atlas-home-heading mb-5">{lang==='nl'?'De atlas':'The atlas'}</h2>{isLoading?<p role="status">{lang==='nl'?'Brouwers laden…':'Loading breweries…'}</p>:isError?<p>{lang==='nl'?'De tellers zijn even niet beschikbaar.':'The counters are temporarily unavailable.'}</p>:<AtlasCounters rows={data}/>}<p className="mt-6 mb-5 text-muted-foreground">{lang==='nl'?'Kleine Belgische brouwers, met nagekeken feiten en mijn eigen woorden waar ik al geproefd heb.':'Small Belgian breweries, with checked facts and my own words where I have already tasted.'}</p><Button asChild className="rounded-full min-h-11"><Link to={atlasPath(lang)}>{lang==='nl'?'Naar de atlas':'View the atlas'}</Link></Button></div></section>}
