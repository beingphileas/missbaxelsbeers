import {ROLE_KEYS,INTERVIEW_CLOSING_LINE} from './editorial';
export {interviewDraftContent,validInterviewToken,reconcileAnswers} from '../../supabase/functions/_shared/interviewContent';
export type {InterviewAnswer} from '../../supabase/functions/_shared/interviewContent';
export {ROLE_KEYS,INTERVIEW_CLOSING_LINE};
export const closingLabel=(language:string)=>language==='en'?'Have you eaten yet?':INTERVIEW_CLOSING_LINE;
export const roleLabel=(role:string,language:'nl'|'en')=>({brewer:['Brouwer','Brewer'],maltster:['Mouter','Maltster'],hop_grower:['Hopteler','Hop grower'],label_designer:['Etiketontwerper','Label designer'],bar_owner:['Cafébaas','Bar owner'],beer_shop:['Bierhandel','Beer seller'],other:['Andere','Other']}[role]||['Andere','Other'])[language==='en'?1:0];
export const inviteMessage=(name:string,link:string,lang:string)=>lang==='nl'?`Dag ${name}, ik schrijf op MissBaxel's Beers over kleine brouwers en ik zou je graag aan mijn toog hebben. Het zijn een paar vaste vragen, je vult ze in wanneer het past: ${link}. Marijke`:`Hi ${name}, I write about small breweries on MissBaxel's Beers and I would love you to join me at the bar. There are a few regular questions, and you can answer whenever it suits you: ${link}. Marijke`;
