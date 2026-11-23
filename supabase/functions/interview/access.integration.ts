import {test,expect} from 'bun:test';
const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
if(!key)throw new Error('Local publishable key required');
const headers={'apikey':key,'Authorization':`Bearer ${key}`,'Content-Type':'application/json'};
async function call(body:unknown){return fetch('http://127.0.0.1:8001/functions/v1/interview',{method:'POST',headers,body:JSON.stringify(body)});}
test('no token yields no readable interview',async()=>{const r=await call({action:'get'});expect(r.status).toBe(404);expect(await r.json()).toEqual({error:'Not found'});});
test('invalid token yields no readable interview',async()=>{const r=await call({action:'get',token:'invalid'});expect(r.status).toBe(404);expect(await r.json()).toEqual({error:'Not found'});});
test('unknown high-entropy token yields no readable interview',async()=>{const r=await call({action:'get',token:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','')});expect(r.status).toBe(404);expect(await r.json()).toEqual({error:'Not found'});});
test('public callers cannot create invitations',async()=>{const r=await call({action:'create',person_name:'',brewery_id:null,role:'brewer',language:'nl'});expect([401,403]).toContain(r.status);});
test('public callers cannot generate drafts',async()=>{const r=await call({action:'draft',invite_id:crypto.randomUUID()});expect([401,403]).toContain(r.status);});
test('direct public access cannot read invitation rows',async()=>{const r=await fetch('http://127.0.0.1:8001/rest/v1/interview_invites?select=id',{headers});if(r.ok)expect(await r.json()).toEqual([]);else expect([401,403,404]).toContain(r.status);});
