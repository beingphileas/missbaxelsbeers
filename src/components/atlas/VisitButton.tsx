import {Check} from 'lucide-react';
import {useLanguage} from '@/hooks/useLanguage';
import {useStampCard} from '@/hooks/useStampCard';
import {Button} from '@/components/ui/button';
export default function VisitButton({id,name}:{id:string;name:string}){const {lang}=useLanguage();const {visited,toggle}=useStampCard();const active=visited.includes(id);const label=lang==='nl'?'Jij was hier':"You've been here";return <Button size="sm" variant="ghost" className="rounded-md min-h-11 justify-start" role="checkbox" aria-label={`${label}: ${name}`} aria-checked={active} onClick={()=>toggle(id)}><span className="atlas-visit-box w-5 h-5 shrink-0 border border-current rounded-sm flex items-center justify-center" aria-hidden="true">{active&&<Check size={16}/>}</span>{label}</Button>;}
