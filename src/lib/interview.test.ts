import {describe,it,expect} from 'vitest';
import {interviewDraftContent,validInterviewToken,reconcileAnswers,INTERVIEW_CLOSING_LINE} from './interview';
const question={question_id:'08000000-0000-4000-8000-000000000001',question:'Wat maakt een bier goed voor jou?',answer:''};
describe('interview token boundary',()=>{
 it('refuses absent, short and path-shaped tokens',()=>{for(const token of [undefined,null,'','a'.repeat(31),'../'+ 'a'.repeat(64),'a'.repeat(257)])expect(validInterviewToken(token)).toBe(false);});
 it('accepts the cryptographically generated 64-character token format',()=>expect(validInterviewToken('9f'.repeat(32))).toBe(true));
});
describe('verbatim interview draft',()=>{
 it('keeps spelling, punctuation and newlines, only collapsing double spaces',()=>{
  const input="geen  herschrijving, geen correcties behalve dubbele spaties\nLETTERLIJK zoals ingestuurd";
  const content=interviewDraftContent([{...question,answer:input}],'antwoord op "Heb je al gegeten?"','nl');
  expect(content).toBe("[Marijke: jouw aanloopje, twee alinea's over waarom deze brouwer]\n\n## Wat maakt een bier goed voor jou?\n\ngeen herschrijving, geen correcties behalve dubbele spaties\nLETTERLIJK zoals ingestuurd\n\n## Heb je al gegeten?\n\nantwoord op \"Heb je al gegeten?\"");
 });
 it('keeps questions in order and allows empty answers',()=>expect(interviewDraftContent([question,{...question,question_id:'b',question:'Tweede vraag'}],'','nl')).toBe("[Marijke: jouw aanloopje, twee alinea's over waarom deze brouwer]\n\n## Wat maakt een bier goed voor jou?\n\n\n\n## Tweede vraag\n\n\n\n## Heb je al gegeten?\n\n"));
 it('keeps English answers untouched and uses the English closing line',()=>{const result=interviewDraftContent([{...question,answer:'I get to read the text before it goes online.'}],'','en');expect(result).toContain('I get to read the text before it goes online.');expect(result).toContain('## Have you eaten yet?');});
 it('uses the established closing constant',()=>expect(interviewDraftContent([],'','nl')).toContain(`## ${INTERVIEW_CLOSING_LINE}`));
});
describe('answer boundary',()=>{
 it('keeps the trusted question text and incoming answer literally',()=>expect(reconcileAnswers([question],[{question_id:question.question_id,answer:'  LETTERLIJK  '}])).toEqual([{...question,answer:'  LETTERLIJK  '}]));
 it('rejects unknown question ids',()=>expect(()=>reconcileAnswers([question],[{question_id:'other',answer:''}])).toThrow());
 it('rejects duplicate answers',()=>expect(()=>reconcileAnswers([question],[{question_id:question.question_id,answer:''},{question_id:question.question_id,answer:''}])).toThrow());
 it('accepts 3000 characters and rejects 3001',()=>{expect(reconcileAnswers([question],[{question_id:question.question_id,answer:'a'.repeat(3000)}])[0].answer).toHaveLength(3000);expect(()=>reconcileAnswers([question],[{question_id:question.question_id,answer:'a'.repeat(3001)}])).toThrow();});
});
