type SavedInterview = {updated_at: string; status: string; answers: unknown[]; closing_answer: string; consent_publish: boolean};

// Only retry an unchanged answer snapshot: extending a deadline must not overwrite another editor's work.
export async function saveAfterRenewal<T extends SavedInterview>(baseline: T, save: (version: string) => Promise<T>, reload: () => Promise<T>): Promise<T> {
 try { return await save(baseline.updated_at); }
 catch (error) {
  if (!(error instanceof Error) || !('status' in error) || error.status !== 409) throw error;
  const fresh = await reload();
  if (!['uitgenodigd', 'bezig'].includes(fresh.status) || fresh.status !== baseline.status ||
   JSON.stringify(fresh.answers) !== JSON.stringify(baseline.answers) || fresh.closing_answer !== baseline.closing_answer || fresh.consent_publish !== baseline.consent_publish) throw error;
  return save(fresh.updated_at);
 }
}