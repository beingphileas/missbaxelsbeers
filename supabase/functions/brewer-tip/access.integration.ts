import {test,expect} from 'bun:test';
const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;if(!key)throw new Error('Local publishable key required');
const headers={'apikey':key,'Authorization':`Bearer ${key}`,'Content-Type':'application/json'};
const body={brewery_name:'KEUN',municipality:'Ronse',why:'abcdefghij',contact_email:null,is_brewer:false,kind:'nieuwe_brouwer',brewery_id:null,website:''};
const call=(data:unknown)=>fetch('http://127.0.0.1:8001/functions/v1/brewer-tip',{method:'POST',headers,body:JSON.stringify(data)});
test('rejects unknown kinds server-side',async()=>expect((await call({...body,kind:'other'})).status).toBe(400));
test('rejects corrections without a visible brewery',async()=>expect((await call({...body,kind:'correctie'})).status).toBe(400));
test('silently discards honeypot submissions',async()=>{const r=await call({...body,website:'spam'});expect(r.status).toBe(200);expect(await r.json()).toEqual({ok:true});});
test('anonymous callers cannot insert tips directly',async()=>{const {website,...row}=body;const r=await fetch('http://127.0.0.1:8001/rest/v1/brewer_tips',{method:'POST',headers,body:JSON.stringify(row)});expect([401,403]).toContain(r.status);});
