import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface HealthRow {
  key: string;
  last_run_at: string;
  last_status: string;
  last_error: string | null;
}

const SCRAPERS: { key: string; label: string }[] = [
  { key: 'scrape-missbaxels-blog', label: 'Blog' },
  { key: 'scrape-bierstekers', label: 'Bierstekers' },
  { key: 'scrape-restaurant', label: 'Restaurant' },
];

const STALE_DAYS = 30;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

function formatDate(iso: string | null): string {
  if (!iso) return 'nooit';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'vandaag';
  if (days === 1) return 'gisteren';
  if (days < 30) return `${days} dagen geleden`;
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SystemHealthCard() {
  const [rows, setRows] = useState<Record<string, HealthRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('system_health' as any)
      .select('*')
      .in('key', SCRAPERS.map(s => s.key))
      .then(({ data }) => {
        const map: Record<string, HealthRow> = {};
        for (const r of (data as any) || []) map[r.key] = r;
        setRows(map);
        setLoading(false);
      });
  }, []);

  const warnings = SCRAPERS
    .map(s => {
      const r = rows[s.key];
      if (!r) return { ...s, reason: `nog niet gedraaid` as string, error: null as string | null };
      const stale = Date.now() - new Date(r.last_run_at).getTime() > STALE_MS;
      if (r.last_status === 'error') return { ...s, reason: 'fout bij laatste run', error: r.last_error };
      if (stale) return { ...s, reason: `langer dan ${STALE_DAYS} dagen geleden`, error: null };
      return null;
    })
    .filter(Boolean) as { key: string; label: string; reason: string; error: string | null }[];

  return (
    <div className="mb-5 bg-card border border-border rounded-[12px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Systeem
        </h3>
        {loading && <span className="text-[11px] text-muted-foreground">…</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SCRAPERS.map(s => {
          const r = rows[s.key];
          const ok = r?.last_status === 'ok';
          const error = r?.last_status === 'error';
          const Icon = !r ? Clock : error ? XCircle : ok ? CheckCircle2 : Clock;
          const color = !r
            ? 'text-muted-foreground'
            : error
            ? 'text-red-600'
            : 'text-emerald-600';
          return (
            <div
              key={s.key}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-border bg-background"
            >
              <Icon size={14} className={color} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium truncate">{s.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {formatDate(r?.last_run_at ?? null)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map(w => (
            <div
              key={w.key}
              className="flex items-start gap-2 px-3 py-2 rounded-[8px] bg-yellow-50 border border-yellow-300 text-yellow-900"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div className="text-[12px] leading-snug">
                <span className="font-semibold">{w.label}</span> — {w.reason}
                {w.error && (
                  <div className="mt-0.5 text-[11px] opacity-80 break-words">{w.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
