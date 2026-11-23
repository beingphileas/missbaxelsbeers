import {useEffect,useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {useLanguage} from '@/hooks/useLanguage';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import type {Database} from '@/integrations/supabase/types';
type Tip=Database['public']['Tables']['brewer_tips']['Row'];
export default function TipsSection(){const {lang}=useLanguage();const en=lang==='en';const [rows,setRows]=useState<Tip[]>([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState<string|null>(null);const [error,setError]=useState('');
 async function load(){setLoading(true);const all:Tip[]=[];for(let start=0;;start+=1000){const {data,error}=await supabase.from('brewer_tips').select('*').order('created_at',{ascending:false}).range(start,start+999);if(error){setError(error.message);break;}all.push(...(data||[]));if(!data||data.length<1000)break;}setRows(all);setLoading(false);}
 useEffect(()=>{void load();},[]);
 async function update(tip:Tip,status:string){setBusy(tip.id);const {error}=await supabase.from('brewer_tips').update({status}).eq('id',tip.id);setBusy(null);if(error){toast.error(error.message);return;}setRows(rows=>rows.map(r=>r.id===tip.id?{...r,status}:r));}
 return <section><h1 className="text-2xl mb-6">Tips</h1>{error&&<p role="alert">{error}</p>}{loading?<p role="status">{en?'Loading…':'Laden…'}</p>:rows.length===0?<p>{en?'No tips received yet.':'Er zijn nog geen tips binnengekomen.'}</p>:<div className="space-y-4">{rows.map(r=><article key={r.id} className="bg-card border border-border rounded-lg p-5"><div className="flex justify-between gap-4"><h2 className="text-lg">{r.brewery_name}</h2><span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString(en?'en-GB':'nl-BE')}</span></div><p className="text-muted-foreground text-sm">{r.municipality} · {r.kind==='correctie'?(en?'Correction':'Correctie'):(en?'New brewer':'Nieuwe brouwer')}{r.is_brewer?` · ${en?'Submitted by brewer':'Van de brouwer'}`:''}</p><p className="whitespace-pre-wrap my-4">{r.why}</p>{r.contact_email&&<a className="text-primary" href={`mailto:${r.contact_email}`}>{r.contact_email}</a>}<div className="flex gap-2 mt-4">{[['nieuw','New'],['bekeken','Viewed'],['verwerkt','Processed']].map(([s,label])=><Button key={s} size="sm" variant={r.status===s?'default':'outline'} aria-pressed={r.status===s} disabled={busy===r.id} onClick={()=>update(r,s)}>{en?label:s}</Button>)}</div></article>)}</div>}</section>;
}
