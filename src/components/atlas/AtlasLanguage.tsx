import {useLanguage} from '@/hooks/useLanguage';
import {useLocation,useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
export default function AtlasLanguage(){const {lang,setLang}=useLanguage();const location=useLocation();const navigate=useNavigate();const change=(l:'nl'|'en')=>{setLang(l);const nl=location.pathname.replace(/^\/en(?=\/brouwers)/,'');navigate((l==='en'?'/en':'')+nl+location.search+location.hash);};return <div role="group" aria-label={lang==='nl'?'Taal':'Language'} className="flex gap-1">{(['nl','en'] as const).map(l=><Button key={l} variant={lang===l?'default':'ghost'} size="sm" className="rounded-full" aria-pressed={lang===l} onClick={()=>change(l)}>{l.toUpperCase()}</Button>)}</div>;}
