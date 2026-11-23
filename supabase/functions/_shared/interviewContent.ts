export const INTERVIEW_CLOSING_LINE = 'Heb je al gegeten?';
export type InterviewAnswer = {question_id:string;question:string;answer:string};
export function validInterviewToken(token: unknown): token is string {
 return typeof token==='string' && /^[A-Za-z0-9_-]{32,256}$/.test(token);
}
/** Preserve the brewer's spelling, punctuation and line breaks. Only double spaces are removed. */
export function interviewDraftContent(answers:InterviewAnswer[],closing:string,language:'nl'|'en',closingLine=INTERVIEW_CLOSING_LINE):string {
 const literal=(text:string)=>text.replace(/ {2,}/g,' ');
 const sections=answers.map(a=>`## ${a.question}\n\n${literal(a.answer)}`);
 return ["[Marijke: jouw aanloopje, twee alinea's over waarom deze brouwer]",...sections,`## ${language==='en'?'Have you eaten yet?':closingLine}\n\n${literal(closing)}`].join('\n\n');
}
export function reconcileAnswers(stored:InterviewAnswer[],incoming:{question_id:string;answer:string}[]):InterviewAnswer[] {
 const ids=new Set(stored.map(a=>a.question_id));const seen=new Set<string>();
 for(const answer of incoming){if(!ids.has(answer.question_id)||seen.has(answer.question_id)||typeof answer.answer!=='string'||answer.answer.length>3000)throw new Error('Invalid answer');seen.add(answer.question_id);}
 const values=new Map(incoming.map(a=>[a.question_id,a.answer]));
 return stored.map(a=>({...a,answer:values.get(a.question_id)??a.answer}));
}
