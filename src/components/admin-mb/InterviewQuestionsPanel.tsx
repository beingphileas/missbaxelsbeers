import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { inputCls, btnPrimary } from './ui';
import { ROLE_LABELS, INTERVIEW_CLOSING_LINE } from '@/lib/editorial';

type Q = { id: string; position: number; question_nl: string; is_core: boolean };
const db = supabase as any;

export default function InterviewQuestionsPanel({ role }: { role: string }) {
  const [qs, setQs] = useState<Q[] | null>(null);
  const [extra, setExtra] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await db.from('interview_questions').select('id,position,question_nl,is_core')
      .eq('role', role).order('position');
    setQs(data || []);
  }
  useEffect(() => { setQs(null); load(); }, [role]);

  async function createSet() {
    setBusy(true);
    const { data: core, error } = await db.from('interview_questions').select('question_nl,position')
      .eq('role', 'brewer').eq('is_core', true).order('position');
    if (error || !core?.length) { setBusy(false); return toast.error(error?.message || 'Geen kernvragen gevonden'); }
    const rows = core.slice(0, 6).map((c: any, i: number) => ({ role, position: i + 1, is_core: true, question_nl: c.question_nl }));
    const { error: e2 } = await db.from('interview_questions').insert(rows);
    setBusy(false);
    if (e2) return toast.error(e2.message);
    load();
  }

  async function addExtra(pos: number) {
    const text = (extra[pos] || '').trim();
    if (!text) return;
    const { error } = await db.from('interview_questions').insert({ role, position: pos, is_core: false, question_nl: text });
    if (error) return toast.error(error.message);
    setExtra(x => ({ ...x, [pos]: '' }));
    load();
  }

  const taken = new Set((qs || []).map(q => q.position));
  const openSlots = qs && qs.length > 0 ? [7, 8, 9, 10].filter(p => !taken.has(p)) : [];

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Vragenset — {ROLE_LABELS[role] || role}
      </p>
      {qs === null ? <p className="text-[12px] text-muted-foreground">Laden…</p> : qs.length === 0 ? (
        <button type="button" onClick={createSet} disabled={busy} className={btnPrimary}>
          {busy ? 'Bezig…' : 'Maak vragenset'}
        </button>
      ) : (
        <ol className="space-y-2 text-[13px]">
          {qs.map(q => (
            <li key={q.id} className="flex gap-2">
              <span className="text-muted-foreground tabular-nums w-5 shrink-0">{q.position}.</span>
              <span>{q.question_nl}</span>
            </li>
          ))}
        </ol>
      )}
      {openSlots.map(pos => (
        <div key={pos} className="flex gap-2 items-center">
          <span className="text-muted-foreground tabular-nums w-5 text-[13px]">{pos}.</span>
          <input className={inputCls} placeholder={`Vraag ${pos}`} value={extra[pos] || ''}
            onChange={e => setExtra(x => ({ ...x, [pos]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtra(pos); } }} />
          <button type="button" onClick={() => addExtra(pos)} className={btnPrimary}>Voeg toe</button>
        </div>
      ))}
      <p className="text-[13px] italic pt-2 border-t border-border">{INTERVIEW_CLOSING_LINE}</p>
    </div>
  );
}
