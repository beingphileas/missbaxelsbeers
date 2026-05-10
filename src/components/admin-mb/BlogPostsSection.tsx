import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save, Upload, Sparkles, Copy } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';


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
  const [importing, setImporting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function scrapeMissBaxels() {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-missbaxels-blog');
      if (error) throw error;
      toast.success(`${data.upserted}/${data.discovered} posts geïmporteerd`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Scrape mislukt');
    } finally { setScraping(false); }
  }

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

  async function importCsv(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('CSV is leeg');
      const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
      const expected = ['title','date','style','brewery_name','excerpt','external_url'];
      const missing = expected.filter(c => !headers.includes(c));
      if (missing.length) throw new Error('Ontbrekende kolommen: ' + missing.join(', '));

      const rowsToInsert = lines.slice(1).map(line => {
        const cells = parseCsvLine(line);
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = cells[i] ?? '');
        return {
          title: obj.title.trim(),
          slug: slugify(obj.title) + '-' + Math.random().toString(36).slice(2, 7),
          date: obj.date || null,
          style: obj.style || null,
          brewery_name: obj.brewery_name || null,
          excerpt: obj.excerpt || null,
          external_url: obj.external_url || null,
          content: obj.excerpt || obj.title,
          status: 'published',
        };
      }).filter(r => r.title);

      const { error } = await supabase.from('blog_posts').insert(rowsToInsert);
      if (error) throw error;
      toast.success(`${rowsToInsert.length} posts geïmporteerd`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (editing || creating) return <PostForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />;

  return (
    <div>
      <AdminHeader title="Blogposts" subtitle={`${rows.length} posts`} right={
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <button onClick={scrapeMissBaxels} disabled={scraping} className={btnGhost}>
            {scraping ? 'Scrapen…' : 'Scrape missbaxelsbeers.com'}
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing} className={btnGhost}>
            <Upload size={12} /> {importing ? 'Importeren…' : 'CSV importeren'}
          </button>
          <button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={13} /> Nieuwe post</button>
        </div>
      } />
      <p className="text-[11px] text-muted-foreground -mt-3 mb-4">CSV-kolommen: title, date, style, brewery_name, excerpt, external_url</p>

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

function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') inQ = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
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
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!initial && title && !slug) setSlug(slugify(title)); }, [title]);

  async function save() {
    if (!title.trim()) return toast.error('Titel verplicht');
    setSaving(true);
    const payload: any = {
      title: title.trim(), slug: slug.trim() || slugify(title),
      date: date || null, style: style.trim() || null, style_category: styleCat || null,
      brewery_name: brewery.trim() || null, excerpt: excerpt.trim() || null,
      content: content || excerpt || title, external_url: externalUrl.trim() || null,
      image_emoji: emoji.trim() || null,
      status: 'published',
    };
    if (initial) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from('blog_posts').insert(payload);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div>
      <AdminHeader title={initial ? `Bewerken: ${initial.title}` : 'Nieuwe blogpost'} right={
        <div className="flex gap-2">
          <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <AdminCard className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Titel"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Slug"><input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
          <Field label="Datum"><input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Brouwerij (naam)"><input className={inputCls} value={brewery} onChange={e => setBrewery(e.target.value)} /></Field>
          <Field label="Stijl"><input className={inputCls} value={style} onChange={e => setStyle(e.target.value)} /></Field>
          <Field label="Stijl-categorie">
            <select className={inputCls} value={styleCat} onChange={e => setStyleCat(e.target.value)}>
              <option value="">—</option>
              {['tripel','saison','donker','zuur','wit','speciaal'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Externe URL" hint="Link naar originele post op missbaxelsbeers.com">
            <input className={inputCls} value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://missbaxelsbeers.com/…" />
          </Field>
          <Field label="Emoji (fallback)"><input className={inputCls} value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🍺" /></Field>
        </div>
        <Field label="Excerpt"><textarea rows={2} className={inputCls} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></Field>
        <Field label="Content (markdown)"><textarea rows={10} className={inputCls} value={content} onChange={e => setContent(e.target.value)} /></Field>
      </AdminCard>
    </div>
  );
}
