export const INTERVIEW_DAYS = 60;
export const AUTOSAVE_MS = 5000;
export const INTERVIEW_TOKEN_LIMIT = 240; // per ten minutes, enough for 120 five-second saves
export const inviteExpiry = (now = new Date()) => new Date(now.getTime()+INTERVIEW_DAYS*86400000).toISOString();
export function interviewAccess(invite:{status:string;expires_at:string}, now=Date.now()) {
 if(invite.status==='verwerkt')return 'processed';
 if(Date.parse(invite.expires_at)<=now)return 'expired';
 return 'active';
}
