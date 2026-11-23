import {tipSchema} from './validation.ts';
const tip={brewery_name:'AB',municipality:'AB',why:'abcdefghij',contact_email:null,is_brewer:false,kind:'nieuwe_brouwer',brewery_id:null,website:''};
Deno.test('only accepts the two kinds and coherent brewery links',()=>{
 if(!tipSchema.safeParse(tip).success)throw new Error('Valid tip refused');
 for(const bad of [{...tip,kind:'other'},{...tip,kind:'correctie'},{...tip,brewery_id:crypto.randomUUID()}])if(tipSchema.safeParse(bad).success)throw new Error('Invalid tip accepted');
});
Deno.test('checks server side length and email bounds',()=>{
 for(const bad of [{...tip,why:'short'},{...tip,why:'a'.repeat(2001)},{...tip,brewery_name:'a'.repeat(161)},{...tip,contact_email:'invalid'}])if(tipSchema.safeParse(bad).success)throw new Error('Invalid bounds accepted');
});
