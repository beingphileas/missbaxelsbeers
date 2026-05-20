import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import { RUBRICS, RUBRIC_KEYS, type RubricKey, isRubricKey } from '@/lib/rubrics';

interface PostRow {
  id: string; title: string; slug: string; date: string | null; style: string | null;
  style_category: string | null; brewery_name: string | null; excerpt: string | null;
  content: string; external_url: string | null; image_emoji: string | null;
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function BlogPostsSection() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('blog_posts')
      .select('id,title,slug,date,style,style_category,brewery_name,excerpt,content,external_url,image_emoji')
      .order('date', { ascending: false, nullsFirst: false })
      .limit(1000);
    if (error) toast.error(error.message); else setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Blogpost verwijderen?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  if (editing || creating) return <PostForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />;

  return (
    <div>
      <AdminHeader title="Blogposts" subtitle={`${rows.length} posts`} right={
        <button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={13} /> Nieuwe post</button>
      } />

      {loading ? <p className="text-muted-foreground text-sm">Laden…</p> : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Datum</th>
              <th className="px-4 py-2.5 font-medium">Titel</th>
              <th className="px-4 py-2.5 font-medium">Brouwerij</th>
              <th className="px-4 py-2.5 font-medium">Stijl</th>
              <th className="px-4 py-2.5 font-medium text-right">Acties</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums text-[12px]">{r.date || '—'}</td>
                  <td className="px-4 py-2.5 font-medium">{r.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.brewery_name || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.style || '—'}</td>
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

function PostForm({ initial, onClose, onSaved }: { initial: PostRow | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [date, setDate] = useState(initial?.date || '');
  const [style, setStyle] = useState(initial?.style || '');
  const [styleCat, setStyleCat] = useState(initial?.style_category || '');
  const [brewery, setBrewery] = useState(initial?.brewery_name || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [externalUrl, setExternalUrl] = useState(initial?.external_url || '');
  const [emoji, setEmoji] = useState(initial?.image_emoji || '');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const initialRubric = isRubricKey(initial?.style_category) ? (initial!.style_category as RubricKey) : null;
  const [rubric, setRubric] = useState<RubricKey | ''>(initialRubric || '');
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!rubric) { setScores({}); return; }
    const def = RUBRICS[rubric];
    setScores(prev => {
      const next: Record<string, number> = {};
      for (const f of def.scores) next[f.key] = prev[f.key] ?? 4;
      return next;
    });
  }, [rubric]);

  useEffect(() => { if (!initial && title && !slug) setSlug(slugify(title)); }, [title]);

  useEffect(() => {
    if (!initial) return;
    (async () => {
      const { data } = await supabase
        .from('post_scores' as any)
        .select('rubric, scores')
        .eq('blog_post_id', initial.id)
        .maybeSingle();
      if (data) {
        const d: any = data;
        if (isRubricKey(d.rubric)) {
          setRubric(d.rubric);
          setScores(d.scores || {});
        }
      }
      const { data: bp } = await supabase.from('blog_posts').select('cover_image_url').eq('id', initial.id).maybeSingle();
      if (bp?.cover_image_url) setCoverImageUrl(bp.cover_image_url);
    })();
  }, [initial]);

  async function save() {
    if (!title.trim()) return toast.error('Titel verplicht');
    setSaving(true);
    const payload: any = {
      title: title.trim(), slug: slug.trim() || slugify(title),
      date: date || null, style: style.trim() || null,
      style_category: rubric || (styleCat || null),
      rubric: rubric || null,
      brewery_name: brewery.trim() || null, excerpt: excerpt.trim() || null,
      content: content || excerpt || title, external_url: externalUrl.trim() || null,
      image_emoji: emoji.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      status: 'published',
    };
    let postId = initial?.id;
    if (initial) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select('id').single();
      if (error || !data) { setSaving(false); return toast.error(error?.message || 'Kan post niet aanmaken'); }
      postId = data.id;
    }
    if (rubric && postId) {
      const def = RUBRICS[rubric];
      if (def.scores.length > 0) {
        const cleanScores: Record<string, any> = {};
        for (const f of def.scores) cleanScores[f.key] = Number(scores[f.key]) || 0;
        const { error: rErr } = await supabase.from('post_scores' as any).upsert(
          { blog_post_id: postId, rubric, scores: cleanScores },
          { onConflict: 'blog_post_id' },
        );
        if (rErr) { setSaving(false); return toast.error('Scores opslaan mislukt: ' + rErr.message); }
      } else {
        await supabase.from('post_scores' as any).delete().eq('blog_post_id', postId);
      }
    } else if (!rubric && postId) {
      await supabase.from('post_scores' as any).delete().eq('blog_post_id', postId);
    }
    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  const StarPicker = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <button type="button" key={n} onClick={() => onChange(n)}
            className="text-lg leading-none transition-colors"
            style={{ color: n <= value ? 'var(--hop)' : 'var(--line)' }}
            aria-label={`${label} ${n}`}>★</button>
        ))}
        <span className="ml-2 text-[11px] text-muted-foreground tabular-nums w-8 text-right">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">
      <AdminHeader title={initial ? `Bewerken: ${initial.title}` : 'Nieuwe blogpost'} right={
        <div className="hidden md:flex gap-2">
          <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <AdminCard className="space-y-4 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Titel"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Slug"><input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
          <Field label="Datum"><input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Brouwerij (naam)"><input className={inputCls} value={brewery} onChange={e => setBrewery(e.target.value)} /></Field>
          <Field label="Stijl"><input className={inputCls} value={style} onChange={e => setStyle(e.target.value)} /></Field>
          <Field label="Stijl-categorie">
            <select className={inputCls} value={styleCat} onChange={e => setStyleCat(e.target.value)}>
              <option value="">—</option>
              {[
                'blond','tripel','dubbel','quadrupel','trappist','abdijbier',
                'saison','witbier','tarwebier','weizen',
                'pils','lager','amber','rood','bruin','donker','stout','porter',
                'ipa','neipa','pale ale','session ipa','double ipa',
                'sour','lambiek','geuze','kriek','fruitbier','oud bruin','flemish red',
                'barley wine','strong ale','belgian strong','barrel-aged',
                'alcoholvrij','low alcohol','speciaal','collab','blend'
              ].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Cover-afbeelding URL">
            <input className={inputCls} value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Externe URL" hint="Link naar originele post of website">
            <input className={inputCls} value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Emoji (fallback)"><input className={inputCls} value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🍺" /></Field>
        </div>
        <Field label="Excerpt"><textarea rows={2} className={inputCls} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></Field>
        <Field label="Content (markdown)"><textarea rows={10} className={inputCls} value={content} onChange={e => setContent(e.target.value)} /></Field>

        <div className="border-t border-border pt-4 space-y-4">
          <Field label="Rubriek" hint="Bepaalt de scorekaart">
            <select
              className={inputCls}
              value={rubric}
              onChange={e => setRubric(e.target.value as RubricKey | '')}
            >
              <option value="">— Geen rubriek —</option>
              {RUBRIC_KEYS.map(k => (
                <option key={k} value={k}>{RUBRICS[k].label}</option>
              ))}
            </select>
          </Field>

          {rubric && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {RUBRICS[rubric].label}
              </p>
              <p className="text-[12px] text-muted-foreground mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {RUBRICS[rubric].description} · {RUBRICS[rubric].wordCount[0]}–{RUBRICS[rubric].wordCount[1]} woorden
              </p>
              {RUBRICS[rubric].scores.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">Deze rubriek heeft geen scores.</p>
              ) : (
                RUBRICS[rubric].scores.map(f => (
                  <StarPicker
                    key={f.key}
                    label={f.label}
                    value={scores[f.key] ?? 4}
                    onChange={(n) => setScores(s => ({ ...s, [f.key]: n }))}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </AdminCard>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
        <button onClick={onClose} className={`${btnGhost} flex-1 justify-center py-3`}><ArrowLeft size={14} /> Terug</button>
        <button onClick={save} disabled={saving} className={`${btnPrimary} flex-1 justify-center py-3`}><Save size={14} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
      </div>
    </div>
  );
}
