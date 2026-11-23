import {describe,it,expect,vi} from 'vitest';
import {saveAfterRenewal} from './interview-save';
const baseline={updated_at:'2026-11-23T14:29:00Z',status:'bezig',answers:[],closing_answer:'',consent_publish:false};
const conflict=()=>Object.assign(new Error('Conflict'),{status:409});
describe('saving while the interview link is extended',()=>{
 it('silently saves again with the refreshed version and retains local changes',async()=>{
  const fresh={...baseline,updated_at:'2026-11-23T14:30:00Z'};
  const saved={...fresh,consent_publish:true};
  const save=vi.fn().mockRejectedValueOnce(conflict()).mockResolvedValueOnce(saved);
  expect(await saveAfterRenewal(baseline,save,async()=>fresh)).toEqual(saved);
  expect(save.mock.calls).toEqual([[baseline.updated_at],[fresh.updated_at]]);
 });
 it('does not overwrite answers changed by another session',async()=>{
  const save=vi.fn().mockRejectedValue(conflict());
  await expect(saveAfterRenewal(baseline,save,async()=>({...baseline,consent_publish:true}))).rejects.toThrow('Conflict');
  expect(save).toHaveBeenCalledTimes(1);
 });
 it('does not retry submitted or processed interviews',async()=>{
  for(const status of ['ingestuurd','verwerkt']){
   const save=vi.fn().mockRejectedValue(conflict());
   await expect(saveAfterRenewal(baseline,save,async()=>({...baseline,status}))).rejects.toThrow('Conflict');
   expect(save).toHaveBeenCalledTimes(1);
  }
 });
 it('retries at most once and does not conceal other errors',async()=>{
  const save=vi.fn().mockRejectedValue(conflict());
  await expect(saveAfterRenewal(baseline,save,async()=>baseline)).rejects.toThrow('Conflict');expect(save).toHaveBeenCalledTimes(2);
  const reload=vi.fn();await expect(saveAfterRenewal(baseline,async()=>{throw Object.assign(new Error('Offline'),{status:500});},reload)).rejects.toThrow('Offline');expect(reload).not.toHaveBeenCalled();
 });
});