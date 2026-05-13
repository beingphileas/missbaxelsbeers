import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import SystemHealthCard from './SystemHealthCard';

interface BlendRow {
  id: number; name: string; style: string | null; style_category: string | null;
  year: number | null; description: string | null; flavor_tags: string[] | null;
  untappd_score: number | null; untappd_url: string | null;
}

export default function BierstekersSection() {
  const [rows, setRows] = useState<BlendRow[]>([]);
  const [editing, setEditing] = useState<BlendRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  async function scrapeUntappd() {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-bierstekers');
      if (error) throw error;
      toast.success(`${data.inserted} blends ingevoegd (bron: ${data.source})`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Scrape mislukt');
    } finally { setScraping(false); }
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('bierstekers_blends')
      .select('*').order('year', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    if (!confirm('Blend verwijderen?')) return;
    const { error } = await supabase.from('bierstekers_blends').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  if (editing || creating) return <BlendForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />;

  return (
    <div>
      <AdminHeader title="Bierstekers blends" subtitle={`${rows.length} blends`} right={
        <div className="flex gap-2">
          <button onClick={scrapeUntappd} disabled={scraping} className={btnGhost}>
            {scraping ? 'Scrapen…' : 'Scrape Untappd'}
          </button>
          <button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={13} /> Nieuwe blend</button>
        </div>
      } />
      {loading ? <p className="text-muted-foreground text-sm">Laden…</p> : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Jaar</th>
              <th className="px-4 py-2.5 font-medium">Naam</th>
              <th className="px-4 py-2.5 font-medium">Stijl</th>
              <th className="px-4 py-2.5 font-medium">Untappd</th>
              <th className="px-4 py-2.5 font-medium text-right">Acties</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.year || '—'}</td>
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.style || '—'}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.untappd_score ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right space-x-1">
                    <button onClick={() => setEditing(r)} className={btnGhost}><Pencil size={11} /> Bewerken</button>
                    <button onClick={() => remove(r.id)} className={btnDanger}><Trash2 size={11} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BlendForm({ initial, onClose, onSaved }: { initial: BlendRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [style, setStyle] = useState(initial?.style || '');
  const [styleCat, setStyleCat] = useState(initial?.style_category || '');
  const [year, setYear] = useState(initial?.year?.toString() || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [tags, setTags] = useState((initial?.flavor_tags || []).join(', '));
  const [score, setScore] = useState(initial?.untappd_score?.toString() || '');
  const [url, setUrl] = useState(initial?.untappd_url || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error('Naam verplicht');
    setSaving(true);
    const payload: any = {
      name: name.trim(),
      style: style.trim() || null,
      style_category: styleCat || null,
      year: year ? Number(year) : null,
      description: description.trim() || null,
      flavor_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      untappd_score: score ? Number(score) : null,
      untappd_url: url.trim() || null,
    };
    if (initial) {
      const { error } = await supabase.from('bierstekers_blends').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from('bierstekers_blends').insert(payload);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div>
      <AdminHeader title={initial ? `Bewerken: ${initial.name}` : 'Nieuwe blend'} right={
        <div className="flex gap-2">
          <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <AdminCard className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Naam"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Jaar"><input type="number" className={inputCls} value={year} onChange={e => setYear(e.target.value)} /></Field>
          <Field label="Stijl"><input className={inputCls} value={style} onChange={e => setStyle(e.target.value)} /></Field>
          <Field label="Stijl-categorie">
            <select className={inputCls} value={styleCat} onChange={e => setStyleCat(e.target.value)}>
              <option value="">—</option>
              {['zuur','lambic','zwart','wit'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Untappd score (0-5)"><input type="number" step="0.01" className={inputCls} value={score} onChange={e => setScore(e.target.value)} /></Field>
          <Field label="Untappd URL"><input className={inputCls} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://untappd.com/…" /></Field>
        </div>
        <Field label="Smaak-tags" hint="Komma-gescheiden"><input className={inputCls} value={tags} onChange={e => setTags(e.target.value)} /></Field>
        <Field label="Omschrijving"><textarea rows={5} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      </AdminCard>
    </div>
  );
}
