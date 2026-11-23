import {Check} from 'lucide-react';
import {useLanguage} from '@/hooks/useLanguage';
import {useStampCard} from '@/hooks/useStampCard';
import {Button} from '@/components/ui/button';
export default function VisitButton({id,name}:{id:string;name:string}){const {lang}=useLanguage();const {visited,toggle}=useStampCard();const active=visited.includes(id);const label=lang==='nl'?'Ik was hier':"I've been here";return <Button size="sm" variant={active?'secondary':'outline'} className="rounded-full" aria-label={`${label}: ${name}`} aria-pressed={active} onClick={()=>toggle(id)}>{active&&<Check aria-hidden="true"/>}{label}</Button>;}
