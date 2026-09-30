import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import { EDITORIAL_RUBRICS, ROLE_LABELS } from '@/lib/editorial';
import InterviewQuestionsPanel from './InterviewQuestionsPanel';

interface PostRow {
  id: string; title: string; slug: string; date: string | null; style: string | null;
  style_category: string | null; brewery_name: string | null; excerpt: string | null;
  content: string; external_url: string | null; image_emoji: string | null;
  rubric: string | null; person_id: string | null;
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
      .select('id,title,slug,date,style,style_category,brewery_name,excerpt,content,external_url,image_emoji,rubric,person_id')
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

  const [rubric, setRubric] = useState<string>(initial?.rubric || '');
  const [personId, setPersonId] = useState<string>(initial?.person_id || '');
  const [people, setPeople] = useState<{ id: string; name: string; role: string }[]>([]);
  useEffect(() => {
    (supabase as any).from('people').select('id,name,role').order('name').then(({ data }: any) => setPeople(data || []));
  }, []);
  const person = people.find(p => p.id === personId);
  const showQuestions = rubric === 'tien_vragen' && !!person;

  useEffect(() => { if (!initial && title && !slug) setSlug(slugify(title)); }, [title]);

  useEffect(() => {
    if (!initial) return;
    supabase.from('blog_posts').select('cover_image_url').eq('id', initial.id).maybeSingle()
      .then(({ data: bp }) => { if (bp?.cover_image_url) setCoverImageUrl(bp.cover_image_url); });
  }, [initial]);

  // Ctrl/Cmd+S = save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function save() {
    if (!title.trim()) return toast.error('Titel verplicht');
    setSaving(true);
    const payload: any = {
      title: title.trim(), slug: slug.trim() || slugify(title),
      date: date || null, style: style.trim() || null,
      style_category: styleCat || null,
      rubric: rubric || null,
      person_id: rubric === 'tien_vragen' ? (personId || null) : null,
      brewery_name: brewery.trim() || null, excerpt: excerpt.trim() || null,
      content: content || excerpt || title, external_url: externalUrl.trim() || null,
      image_emoji: emoji.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      status: 'published',
    };
    if (initial) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select('id').single();
      if (error || !data) { setSaving(false); return toast.error(error?.message || 'Kan post niet aanmaken'); }
    }
    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div className="pb-24 md:pb-0">
      <AdminHeader title={initial ? `Bewerken: ${initial.title}` : 'Nieuwe blogpost'} right={
        <div className="hidden md:flex gap-2">
          <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <div className={showQuestions ? "grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start" : ""}>
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
        <Field label="Excerpt" hint={`${excerpt.length}/160 — ideaal voor SEO en sociale media`}>
          <textarea rows={2} maxLength={200} className={inputCls} value={excerpt} onChange={e => setExcerpt(e.target.value)} />
        </Field>
        <Field label="Content (markdown)"><textarea rows={10} className={inputCls} value={content} onChange={e => setContent(e.target.value)} /></Field>

        <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Rubriek">
            <select className={inputCls} value={rubric} onChange={e => setRubric(e.target.value)}>
              <option value="">— Geen rubriek —</option>
              {EDITORIAL_RUBRICS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </Field>
          {rubric === 'tien_vragen' && (
            <Field label="Persoon">
              <select className={inputCls} value={personId} onChange={e => setPersonId(e.target.value)}>
                <option value="">—</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name} ({ROLE_LABELS[p.role] || p.role})</option>)}
              </select>
            </Field>
          )}
        </div>
      </AdminCard>
      {showQuestions && <div className="lg:sticky lg:top-24"><InterviewQuestionsPanel role={person!.role} /></div>}
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
        <button onClick={onClose} className={`${btnGhost} flex-1 justify-center py-3`}><ArrowLeft size={14} /> Terug</button>
        <button onClick={save} disabled={saving} className={`${btnPrimary} flex-1 justify-center py-3`}><Save size={14} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
      </div>
    </div>
  );
}
