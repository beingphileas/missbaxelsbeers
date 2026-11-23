import {useLanguage} from '@/hooks/useLanguage';
import {Button} from '@/components/ui/button';
export default function AtlasLanguage(){const {lang,setLang}=useLanguage();return <div role="group" aria-label={lang==='nl'?'Taal':'Language'} className="flex gap-1">{(['nl','en'] as const).map(l=><Button key={l} variant={lang===l?'default':'ghost'} size="sm" className="rounded-full" aria-pressed={lang===l} onClick={()=>setLang(l)}>{l.toUpperCase()}</Button>)}</div>;}
