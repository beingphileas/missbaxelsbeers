import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {checkRateLimit,rateLimitKey,rateLimitResponse} from '../_shared/rateLimit.ts';
import {tipSchema} from './validation.ts';
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 try{
  const text=await req.text();if(text.length>12000)return response({error:'Request too large'},413);
  let body;try{body=JSON.parse(text);}catch{return response({error:'Invalid tip'},400);}
  if(typeof body?.website==='string'&&body.website.trim())return response({ok:true});
  const parsed=tipSchema.safeParse(body);if(!parsed.success)return response({error:'Invalid tip'},400);
  const rate=await checkRateLimit(rateLimitKey(req),'brewer-tip',5);if(rate.count===0)return response({error:'Temporarily unavailable'},503);if(!rate.ok)return rateLimitResponse(rate,corsHeaders);
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)return response({error:'Temporarily unavailable'},503);
  const client=createClient(url,key);const {website,...tip}=parsed.data;
  if(tip.brewery_id){const {data,error}=await client.from('breweries').select('id').eq('id',tip.brewery_id).eq('atlas_visible',true).maybeSingle();if(error)throw error;if(!data)return response({error:'Visible brewery required'},400);}
  const {error}=await client.from('brewer_tips').insert({...tip,status:'nieuw'});if(error)throw error;
  return response({ok:true});
 }catch{return response({error:'The tip could not be sent.'},500);}
});
