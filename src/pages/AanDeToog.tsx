import {useEffect,useRef,useState} from 'react';
import {useParams} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import {supabase} from '@/integrations/supabase/client';
import {useLanguage} from '@/hooks/useLanguage';
import {Button} from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import NotFound from './NotFound';
import {closingLabel,validInterviewToken,type InterviewAnswer} from '@/lib/interview';
import '@/components/atlas/atlas.css';
type Invite={person_name:string;language:'nl'|'en';status:string;answers:InterviewAnswer[];closing_answer:string;consent_publish:boolean;updated_at:string};
async function request(body:unknown):Promise<Invite>{
 const {data,error}=await supabase.functions.invoke('interview',{body});
 if(error){let status=500;try{status=error.context?.status||500;}catch{/* generic error */}throw Object.assign(new Error('Interview request failed'),{status});}return data;
}
export default function AanDeToog(){
 const {token=''}=useParams();const {lang,setLang}=useLanguage();
 const [invite,setInvite]=useState<Invite|null>(null);const [state,setState]=useState<'loading'|'ready'|'missing'|'error'>('loading');const [saved,setSaved]=useState<'saved'|'saving'|'changed'|'error'>('saved');const [sending,setSending]=useState(false);const [error,setError]=useState('');
 const current=useRef<Invite|null>(null);const version=useRef('');const revision=useRef(0);const savedRevision=useRef(0);const queue=useRef<Promise<unknown>>(Promise.resolve());const timer=useRef<ReturnType<typeof setTimeout>>();const alive=useRef(true);const locked=useRef(false);
 const en=(invite?.language||lang)==='en';
 useEffect(()=>{alive.current=true;locked.current=false;revision.current=0;savedRevision.current=0;
  if(!validInterviewToken(token)){setState('missing');return;}
  setState('loading');request({action:'get',token}).then(data=>{if(!alive.current)return;current.current=data;version.current=data.updated_at;setInvite(data);setLang(data.language);setState('ready');}).catch(e=>{if(alive.current)setState(e.status===404?'missing':'error');});
  return()=>{alive.current=false;clearTimeout(timer.current);};
 },[token]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(revision.current!==savedRevision.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 function persist(action:'save'|'submit'){
  const run=async()=>{
   const value=current.current;if(!value||['ingestuurd','verwerkt'].includes(value.status))return;
   const rev=revision.current;
   if(action==='save'&&rev===savedRevision.current)return;
   if(alive.current)setSaved('saving');
   try{
    const response=await request({action,token,answers:value.answers.map(({question_id,answer})=>({question_id,answer})),closing_answer:value.closing_answer,consent_publish:value.consent_publish,version:version.current});
    version.current=response.updated_at;savedRevision.current=rev;
    if(action==='submit'){current.current=response;if(alive.current)setInvite(response);}else if(current.current)current.current={...current.current,updated_at:response.updated_at,status:response.status};
    if(alive.current){setSaved(revision.current===rev?'saved':'changed');setError('');}
   }catch(e){if(alive.current){setSaved('error');setError(en?'I could not save your answers. Please try again before closing this page.':'Ik kon je antwoorden niet bewaren. Probeer opnieuw voordat je deze pagina sluit.');}throw e;}
  };
  const promise=queue.current.catch(()=>{}).then(run);queue.current=promise;return promise;
 }
 function edit(next:Invite){if(locked.current)return;current.current=next;setInvite(next);revision.current+=1;setSaved('changed');clearTimeout(timer.current);timer.current=setTimeout(()=>{void persist('save').catch(()=>{});},1200);}
 async function submit(e:React.FormEvent){e.preventDefault();if(!current.current?.consent_publish)return;clearTimeout(timer.current);locked.current=true;setSending(true);try{await persist('submit');}catch{/* show retained answers and retry */}finally{locked.current=false;setSending(false);}}
 const head=<><SEOHead title={en?'At the bar with…':'Aan de toog met…'} description={en?'Your personal interview with MissBaxel.':'Jouw persoonlijke interview met MissBaxel.'} noindex/><Helmet><meta name="referrer" content="no-referrer"/></Helmet></>;
 if(state==='missing')return <>{head}<NotFound/></>;
 if(state==='loading')return <div className="atlas max-w-3xl mx-auto px-5 py-14">{head}<p role="status">{en?'Loading your questions…':'Je vragen laden…'}</p></div>;
 if(state==='error'||!invite)return <div className="atlas max-w-3xl mx-auto px-5 py-14">{head}<p role="alert">{en?'I could not load your interview. Please try again.':'Ik kon je interview niet laden. Probeer opnieuw.'}</p><Button onClick={()=>window.location.reload()}>{en?'Try again':'Probeer opnieuw'}</Button></div>;
 const readOnly=['ingestuurd','verwerkt'].includes(invite.status);
 return <section className="atlas max-w-3xl mx-auto px-5 md:px-8 py-14">{head}<h1 className="text-3xl md:text-4xl mb-6">{en?'At the bar with…':'Aan de toog met…'}</h1>{readOnly?<><p className="atlas-lead text-lg leading-relaxed mb-8">{en?`Thank you, ${invite.person_name}. I have received your answers. You will get to read the text before it goes online.`:`Dank je, ${invite.person_name}. Ik heb je antwoorden ontvangen. Je krijgt de tekst te lezen voordat hij online komt.`}</p><div className="space-y-8">{invite.answers.map(a=><div key={a.question_id}><h2 className="text-xl mb-3">{a.question}</h2><p className="whitespace-pre-wrap break-words leading-relaxed">{a.answer}</p></div>)}<div><h2 className="text-xl mb-3">{closingLabel(invite.language)}</h2><p className="whitespace-pre-wrap break-words">{invite.closing_answer}</p></div></div></>:<>
 <p className="atlas-lead text-lg leading-relaxed mb-10">{en?`Hi ${invite.person_name}, I am glad you are joining me at the bar. These are my regular questions. Answer as you would over a beer, briefly or at length, there is no wrong answer. You can take a break, everything is saved.`:`Dag ${invite.person_name}, fijn dat je aan mijn toog komt zitten. Hieronder staan mijn vaste vragen. Antwoord zoals je het aan de toog zou vertellen, kort of lang, er is geen fout antwoord. Je kan tussendoor stoppen, alles wordt bewaard.`}</p>
 <form onSubmit={submit} className="space-y-8"><fieldset disabled={sending} className="space-y-8">
 {invite.answers.map((a,index)=><label className="block" key={a.question_id}><span className="block text-xl font-display mb-3">{a.question}</span><textarea aria-label={a.question} className="w-full min-h-32 rounded-lg border border-border bg-card p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" rows={4} maxLength={3000} value={a.answer} onChange={e=>edit({...invite,answers:invite.answers.map((answer,i)=>i===index?{...answer,answer:e.target.value}:answer)})}/><span className="text-xs text-muted-foreground">{a.answer.length}/3000</span></label>)}
 <label className="block"><span className="block text-xl font-display mb-3">{closingLabel(invite.language)}</span><textarea aria-label={closingLabel(invite.language)} rows={3} maxLength={3000} className="w-full rounded-lg border border-border bg-card p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" value={invite.closing_answer} onChange={e=>edit({...invite,closing_answer:e.target.value})}/><span className="text-xs text-muted-foreground">{invite.closing_answer.length}/3000</span></label>
 <label className="flex items-start gap-3 leading-relaxed"><input type="checkbox" required checked={invite.consent_publish} className="mt-1.5" onChange={e=>edit({...invite,consent_publish:e.target.checked})}/><span>{en?'MissBaxel may publish my answers. I will get to read the text before it goes online.':'MissBaxel mag mijn antwoorden publiceren. Ik krijg de tekst te lezen voor hij online komt.'}</span></label>
 </fieldset><div className="flex flex-wrap items-center gap-4"><Button type="submit" className="rounded-full" disabled={sending||!invite.consent_publish}>{sending?(en?'Sending…':'Insturen…'):(en?'Send answers':'Stuur antwoorden in')}</Button><span role="status" className="text-sm text-muted-foreground">{saved==='saved'?(en?'saved':'bewaard'):saved==='saving'?(en?'saving…':'bewaren…'):saved==='changed'?(en?'changes not yet saved':'wijzigingen nog niet bewaard'):''}</span></div>{error&&<div role="alert"><p>{error}</p><Button type="button" variant="outline" className="mt-3" onClick={()=>{void persist('save').catch(()=>{});}}>{en?'Save again':'Opnieuw bewaren'}</Button></div>}
 </form></>}
 </section>;
}
