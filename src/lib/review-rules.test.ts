import {describe,it,expect} from 'vitest';
import {canPublishPost,isPublicBeer,recentBreweries,ATLAS_PROVINCES} from './review-rules';
import {AUTOSAVE_MS,INTERVIEW_TOKEN_LIMIT,inviteExpiry,interviewAccess} from '../../supabase/functions/_shared/interviewAccess';
describe('review rules',()=>{
 it('blocks publication while either language contains the Marijke placeholder',()=>{expect(canPublishPost(['Done','[Marijke: intro]'])).toBe(false);expect(canPublishPost(['[Marijke: intro]',null])).toBe(false);expect(canPublishPost(['Done',null])).toBe(true);});
 it('only includes named beers in public lifecycle states',()=>{for(const lifecycle_status of ['current','coming_soon','sold_out','archive'])expect(isPublicBeer({lifecycle_status,hide_name:false})).toBe(true);for(const lifecycle_status of ['pipeline','draft',null])expect(isPublicBeer({lifecycle_status})).toBe(false);expect(isPublicBeer({lifecycle_status:'current',hide_name:true})).toBe(false);});
 it('includes only first_seen dates in the last 60 days',()=>expect(recentBreweries([{name:'Old',first_seen:'2026-09-23'},{name:'Boundary',first_seen:'2026-09-24'},{name:'New',first_seen:'2026-11-23'},{name:'Future',first_seen:'2026-11-24'}],new Date('2026-11-23T14:00:00Z')).map(b=>b.name)).toEqual(['New','Boundary']));
 it('provides ten Belgian provinces plus Brussels without duplicating a region',()=>{expect(ATLAS_PROVINCES).toHaveLength(11);expect(ATLAS_PROVINCES).toContain('Brussel');expect(ATLAS_PROVINCES).not.toContain('Vlaanderen');});
 it('autosaves after 5000ms and allows at least 120 saves per ten minutes',()=>{expect(AUTOSAVE_MS).toBe(5000);expect(INTERVIEW_TOKEN_LIMIT).toBeGreaterThanOrEqual(120);});
 it('expires exactly 60 days after creation and hides processed invitations',()=>{const now=new Date('2026-11-23T14:00:00Z');expect(inviteExpiry(now)).toBe('2027-01-22T14:00:00.000Z');expect(interviewAccess({status:'bezig',expires_at:inviteExpiry(now)},now.getTime())).toBe('active');expect(interviewAccess({status:'bezig',expires_at:now.toISOString()},now.getTime())).toBe('expired');expect(interviewAccess({status:'verwerkt',expires_at:inviteExpiry(now)},now.getTime())).toBe('processed');});
});
