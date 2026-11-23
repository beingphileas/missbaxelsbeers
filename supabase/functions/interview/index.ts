import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
import {requireAdmin} from '../_shared/auth.ts';
import {checkRateLimit,rateLimitKey,rateLimitResponse} from '../_shared/rateLimit.ts';
import {validInterviewToken,reconcileAnswers,interviewDraftContent,type InterviewAnswer} from '../_shared/interviewContent.ts';
const roles=['brewer','maltster','hop_grower','label_designer','bar_owner','beer_shop','other'] as const;
const tokenSchema=z.string().refine(validInterviewToken);
const answerSchema=z.object({question_id:z.string().uuid(),answer:z.string().max(3000)}).strict();
const publicSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('get'),token:tokenSchema}).strict(),
 z.object({action:z.literal('save'),token:tokenSchema,answers:z.array(answerSchema).max(100),closing_answer:z.string().max(3000),consent_publish:z.boolean(),version:z.string().datetime({offset:true})}).strict(),
 z.object({action:z.literal('submit'),token:tokenSchema,answers:z.array(answerSchema).max(100),closing_answer:z.string().max(3000),consent_publish:z.literal(true),version:z.string().datetime({offset:true})}).strict(),
]);
const createSchema=z.object({action:z.literal('create'),person_name:z.string().trim().min(2).max(160),brewery_id:z.string().uuid().nullable(),role:z.enum(roles),language:z.enum(['nl','en'])}).strict();
const draftSchema=z.object({action:z.literal('draft'),invite_id:z.string().uuid()}).strict();
function response(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
function serviceClient(){const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)throw new Error('Configuration missing');return createClient(url,key);}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 try{
  if(Number(req.headers.get('content-length')||0)>400000)return response({error:'Request too large'},413);
  const text=await req.text();if(text.length>400000)return response({error:'Request too large'},413);
  let body;try{body=JSON.parse(text);}catch{return response({error:'Invalid request'},400);}
  const client=serviceClient();
  if(body?.action==='create'||body?.action==='draft'){
   const {user,error:adminError}=await requireAdmin(req,corsHeaders);if(adminError||!user)return adminError||response({error:'Unauthorized'},401);
   const rate=await checkRateLimit(rateLimitKey(req,user.id),'interview-admin',60);if(rate.count===0)return response({error:'Temporarily unavailable'},503);if(!rate.ok)return rateLimitResponse(rate,corsHeaders);
   if(body.action==='create'){
    const parsed=createSchema.safeParse(body);if(!parsed.success)return response({error:'Invalid invitation'},400);
    const {action,...input}=parsed.data;
    const {data:questions,error:qerror}=await client.from('interview_questions').select('id,question_nl,question_en').eq('role',input.role).order('position');
    if(qerror)throw qerror;
    if(!questions?.length)return response({error:'No question set for this role'},400);
    const answers=questions.map(q=>({question_id:q.id,question:input.language==='en'?(q.question_en?.trim()||q.question_nl):q.question_nl,answer:''}));
    const {data,error}=await client.from('interview_invites').insert({...input,answers}).select('id,token').single();if(error)throw error;
    return response(data);
   }
   const parsed=draftSchema.safeParse(body);if(!parsed.success)return response({error:'Invalid invitation'},400);
   const {data:invite,error}=await client.from('interview_invites').select('id,status,consent_publish,answers,closing_answer,language,blog_post_id').eq('id',parsed.data.invite_id).maybeSingle();
   if(error)throw error;if(!invite)return response({error:'Not found'},404);
   if(invite.blog_post_id)return response({blog_post_id:invite.blog_post_id});
   if(invite.status!=='ingestuurd'||!invite.consent_publish)return response({error:'Submitted interview with consent required'},409);
   const content=interviewDraftContent(invite.answers as InterviewAnswer[],invite.closing_answer,invite.language);
   // Use the caller's JWT for the admin-checked, atomic transaction.
   const url=Deno.env.get('SUPABASE_URL');const anon=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!anon)throw new Error('Configuration missing');
   const authClient=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}});
   const result=await authClient.rpc('create_interview_draft',{p_invite_id:invite.id,p_content:content});if(result.error)throw result.error;
   return response({blog_post_id:result.data});
  }
  const parsed=publicSchema.safeParse(body);if(!parsed.success)return response({error:'Not found'},404);
  const input=parsed.data;
  const rate=await checkRateLimit(rateLimitKey(req),'interview-public',180);if(rate.count===0)return response({error:'Temporarily unavailable'},503);if(!rate.ok)return rateLimitResponse(rate,corsHeaders);
  const {data:invite,error}=await client.from('interview_invites').select('id,person_name,language,status,answers,closing_answer,consent_publish,updated_at,submitted_at,photo_url').eq('token',input.token).maybeSingle();
  if(error)throw error;if(!invite)return response({error:'Not found'},404);
  const expose=(row:typeof invite)=>({person_name:row.person_name,language:row.language,status:row.status,answers:row.answers,closing_answer:row.closing_answer,consent_publish:row.consent_publish,updated_at:row.updated_at,submitted_at:row.submitted_at,photo_url:row.photo_url});
  if(input.action==='get')return response(expose(invite));
  if(['ingestuurd','verwerkt'].includes(invite.status))return response({error:'Read only'},409);
  let answers;try{answers=reconcileAnswers(invite.answers as InterviewAnswer[],input.answers);}catch{return response({error:'Invalid answers'},400);}
  const payload={answers,closing_answer:input.closing_answer,consent_publish:input.consent_publish,status:input.action==='submit'?'ingestuurd':'bezig',...(input.action==='submit'?{submitted_at:new Date().toISOString()}:{})};
  const {data:updated,error:uerror}=await client.from('interview_invites').update(payload).eq('id',invite.id).eq('updated_at',input.version).in('status',['uitgenodigd','bezig']).select('id,person_name,language,status,answers,closing_answer,consent_publish,updated_at,submitted_at,photo_url').maybeSingle();
  if(uerror)throw uerror;if(!updated)return response({error:'Changed elsewhere. Reload before editing.'},409);
  return response(expose(updated));
 }catch{return response({error:'The interview could not be saved. Please try again.'},500);}
});
