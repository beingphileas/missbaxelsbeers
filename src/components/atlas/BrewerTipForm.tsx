import {useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useLanguage} from '@/hooks/useLanguage';
import {Button} from '@/components/ui/button';
export default function BrewerTipForm({brewery}:{brewery?:{id:string;name:string;municipality:string}}) {
 const {lang}=useLanguage();const en=lang==='en';
 const [honeypot,setHoneypot]=useState('');
 const [name,setName]=useState(brewery?.name||'');const [place,setPlace]=useState(brewery?.municipality||'');const [why,setWhy]=useState('');const [email,setEmail]=useState('');const [self,setSelf]=useState(false);const [state,setState]=useState<'idle'|'saving'|'done'>('idle');const [error,setError]=useState('');
 const cls='w-full rounded-lg bg-card border border-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring';
 async function submit(e:React.FormEvent) {e.preventDefault();setError('');setState('saving');
  const {error}=await supabase.functions.invoke('brewer-tip',{body:{website:honeypot,brewery_name:name.trim(),municipality:place.trim(),why:why.trim(),contact_email:email.trim()||null,is_brewer:self,kind:brewery?'correctie':'nieuwe_brouwer',brewery_id:brewery?.id||null}});
  if(error){setError(en?'Your tip could not be sent. Please try again.':'Je tip kon niet verstuurd worden. Probeer opnieuw.');setState('idle');}else setState('done');
 }
 if(state==='done') return <p role="status" className="py-8">{en?'Thank you. I will take a look.':'Dank je. Ik bekijk het.'}</p>;
 return <form onSubmit={submit} className="grid gap-4 max-w-2xl">
 <label className="sr-only" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label>
 <div className="grid sm:grid-cols-2 gap-4"><label>{en?'Brewery name':'Naam brouwerij'}<input className={cls} value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={160}/></label><label>{en?'Municipality':'Gemeente'}<input className={cls} value={place} onChange={e=>setPlace(e.target.value)} required minLength={2} maxLength={120}/></label></div>
 <label>{brewery?(en?'What needs correcting?':'Wat klopt er niet?'):(en?'Why should I stop by?':'Waarom moet ik hier langs?')}<textarea className={cls} rows={4} value={why} onChange={e=>setWhy(e.target.value)} required minLength={10} maxLength={2000}/></label>
 <label>{en?'Email (optional)':'E-mail (optioneel)'}<input className={cls} type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254}/></label>
 <p className="text-sm text-muted-foreground">{en?'Your email address is only used to reply.':'Je e-mailadres dient alleen om te antwoorden.'}</p>
 <label className="flex items-center gap-2"><input type="checkbox" checked={self} onChange={e=>setSelf(e.target.checked)}/>{en?'I am the brewer myself':'Ik ben zelf de brouwer'}</label>
 {error&&<p role="alert">{error}</p>}<Button type="submit" className="justify-self-start rounded-full" disabled={state==='saving'}>{state==='saving'?(en?'Sending…':'Versturen…'):(en?'Send tip':'Verstuur tip')}</Button>
 </form>;
}
