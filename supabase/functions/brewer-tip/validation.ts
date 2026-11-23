import {z} from 'npm:zod@3';
export const tipSchema=z.object({
 brewery_name:z.string().trim().min(2).max(160),municipality:z.string().trim().min(2).max(120),why:z.string().trim().min(10).max(2000),
 contact_email:z.string().trim().email().max(254).nullable(),is_brewer:z.boolean(),
 kind:z.enum(['nieuwe_brouwer','correctie']),brewery_id:z.string().uuid().nullable(),website:z.string().max(500).default(''),
}).strict().refine(b=>b.kind==='correctie'?b.brewery_id!==null:b.brewery_id===null,{message:'Correction requires a visible brewery; new tips cannot link a brewery.'});
