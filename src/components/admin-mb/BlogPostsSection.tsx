import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save, Upload, Sparkles, Copy } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import SystemHealthCard from './SystemHealthCard';
import BlogAssistantPanel from '@/components/admin/BlogAssistantPanel';
import { Drawer, DrawerContent } from '@/components/ui/drawer';


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
  const [enriching, setEnriching] = useState(false);
  const [deduping, setDeduping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function enrichWithAI() {
    if (!confirm('Verrijk alle posts met ontbrekende metadata via AI? Dit kan even duren.')) return;
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-blog-posts', {
        body: { onlyMissing: true, limit: 100 },
      });
      if (error) throw error;
      toast.success(`${data.updated}/${data.total} posts verrijkt${data.errors ? ` (${data.errors} fouten)` : ''}`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Verrijken mislukt');
    } finally { setEnriching(false); }
  }

  async function dedupPosts() {
    setDeduping(true);
    try {
      const { data: all, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, date')
        .limit(2000);
      if (error) throw error;
      const groups = new Map<string, any[]>();
      for (const p of all || []) {
        const key = (p.title || '').trim().toLowerCase();
        if (!key) continue;
        const arr = groups.get(key) || [];
        arr.push(p);
        groups.set(key, arr);
      }
      const toDelete: string[] = [];
      let dupGroups = 0;
      for (const arr of groups.values()) {
        if (arr.length < 2) continue;
        dupGroups++;
        // keep the one with longest content; tiebreak on oldest date
        arr.sort((a, b) => {
          const lenDiff = (b.content?.length || 0) - (a.content?.length || 0);
          if (lenDiff !== 0) return lenDiff;
          return (a.date || '').localeCompare(b.date || '');
        });
        for (const dup of arr.slice(1)) toDelete.push(dup.id);
      }
      if (toDelete.length === 0) {
        toast.success('Geen duplicaten gevonden');
      } else {
        if (!confirm(`${toDelete.length} duplicaten verwijderen (${dupGroups} groepen)?`)) {
          setDeduping(false);
          return;
        }
        const { error: delErr } = await supabase.from('blog_posts').delete().in('id', toDelete);
        if (delErr) throw delErr;
        toast.success(`${toDelete.length} duplicaten verwijderd`);
        load();
      }
    } catch (e: any) {
      toast.error(e.message || 'Dedup mislukt');
    } finally { setDeduping(false); }
  }

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
      <SystemHealthCard />
      <AdminHeader title="Blogposts" subtitle={`${rows.length} posts`} right={
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <button onClick={scrapeMissBaxels} disabled={scraping} className={btnGhost}>
            {scraping ? 'Scrapen…' : 'Scrape missbaxelsbeers.com'}
          </button>
          <button onClick={dedupPosts} disabled={deduping} className={btnGhost} title="Verwijder dubbele posts (zelfde titel)">
            <Copy size={12} /> {deduping ? 'Bezig…' : 'Dedupliceren'}
          </button>
          <button onClick={enrichWithAI} disabled={enriching} className={btnGhost} title="Vul ontbrekende stijl, categorie, excerpt en emoji via AI">
            <Sparkles size={12} /> {enriching ? 'Verrijken…' : 'Verrijk met AI'}
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
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Biershop review state
  const [isShopReview, setIsShopReview] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopCity, setShopCity] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [scAanbod, setScAanbod] = useState(4);
  const [scKennis, setScKennis] = useState(4);
  const [scSfeer, setScSfeer] = useState(4);
  const [scPrijs, setScPrijs] = useState(4);
  const [scOverall, setScOverall] = useState(4);

  useEffect(() => {
    const onR = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => { if (!initial && title && !slug) setSlug(slugify(title)); }, [title]);

  // Load existing shop review when editing
  useEffect(() => {
    if (!initial) return;
    (async () => {
      const { data } = await supabase.from('shop_reviews' as any).select('*').eq('blog_post_id', initial.id).maybeSingle();
      if (data) {
        const d: any = data;
        setIsShopReview(true);
        setShopName(d.shop_name || ''); setShopCity(d.shop_city || ''); setShopUrl(d.shop_url || '');
        setScAanbod(d.score_aanbod); setScKennis(d.score_kennis);
        setScSfeer(d.score_sfeer); setScPrijs(d.score_prijs); setScOverall(d.score_overall);
      }
    })();
  }, [initial]);

  async function save() {
    if (!title.trim()) return toast.error('Titel verplicht');
    if (isShopReview && (!shopName.trim() || !shopCity.trim())) return toast.error('Shop naam en stad zijn verplicht voor een biershop-review');
    setSaving(true);
    const payload: any = {
      title: title.trim(), slug: slug.trim() || slugify(title),
      date: date || null, style: style.trim() || null,
      style_category: isShopReview ? 'biershop' : (styleCat || null),
      brewery_name: brewery.trim() || null, excerpt: excerpt.trim() || null,
      content: content || excerpt || title, external_url: externalUrl.trim() || null,
      image_emoji: emoji.trim() || null,
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
    if (isShopReview && postId) {
      const reviewPayload: any = {
        blog_post_id: postId,
        shop_name: shopName.trim(), shop_city: shopCity.trim(), shop_url: shopUrl.trim() || null,
        score_aanbod: scAanbod, score_kennis: scKennis, score_sfeer: scSfeer,
        score_prijs: scPrijs, score_overall: scOverall,
      };
      const { error: rErr } = await supabase.from('shop_reviews' as any).upsert(reviewPayload, { onConflict: 'blog_post_id' });
      if (rErr) { setSaving(false); return toast.error('Review opslaan mislukt: ' + rErr.message); }
    } else if (!isShopReview && postId) {
      // Cleanup if toggle was disabled
      await supabase.from('shop_reviews' as any).delete().eq('blog_post_id', postId);
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
          <button
            onClick={() => setAssistantOpen(o => !o)}
            className={`${assistantOpen ? btnPrimary : btnGhost} relative`}
            title="AI stelt vragen en schrijft een eerste versie"
          >
            <Sparkles size={12} /> Assistent
            {!assistantOpen && (
              <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-white px-1 rounded-full">AI</span>
            )}
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <div className={assistantOpen && isDesktop ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-4' : ''}>
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

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isShopReview} onChange={e => setIsShopReview(e.target.checked)} className="h-4 w-4" />
              <span className="text-[13px] font-medium">🏪 Dit is een biershop-review</span>
            </label>

            {isShopReview && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <Field label="Shop naam"><input className={inputCls} value={shopName} onChange={e => setShopName(e.target.value)} /></Field>
                  <Field label="Stad"><input className={inputCls} value={shopCity} onChange={e => setShopCity(e.target.value)} /></Field>
                  <Field label="Website (optioneel)"><input className={inputCls} value={shopUrl} onChange={e => setShopUrl(e.target.value)} placeholder="https://…" /></Field>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Scores</p>
                  <StarPicker label="Aanbod" value={scAanbod} onChange={setScAanbod} />
                  <StarPicker label="Kennis & advies" value={scKennis} onChange={setScKennis} />
                  <StarPicker label="Sfeer" value={scSfeer} onChange={setScSfeer} />
                  <StarPicker label="Prijs/kwaliteit" value={scPrijs} onChange={setScPrijs} />
                  <div className="border-t border-border mt-1 pt-1">
                    <StarPicker label="Algemeen" value={scOverall} onChange={setScOverall} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminCard>

        {assistantOpen && isDesktop && (
          <aside className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
            <BlogAssistantPanel
              title={title}
              onClose={() => setAssistantOpen(false)}
              onDraft={(md) => { setContent(md); setAssistantOpen(false); }}
            />
          </aside>
        )}
      </div>

      {assistantOpen && !isDesktop && (
        <Drawer open={assistantOpen} onOpenChange={setAssistantOpen}>
          <DrawerContent className="h-[85vh]">
            <BlogAssistantPanel
              title={title}
              onClose={() => setAssistantOpen(false)}
              onDraft={(md) => { setContent(md); setAssistantOpen(false); }}
            />
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile sticky save bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3 flex gap-2">
        <button onClick={onClose} className={`${btnGhost} flex-1 justify-center py-3`}><ArrowLeft size={14} /> Terug</button>
        <button onClick={() => setAssistantOpen(true)} className={`${btnGhost} flex-1 justify-center py-3`}><Sparkles size={14} /> Assistent</button>
        <button onClick={save} disabled={saving} className={`${btnPrimary} flex-1 justify-center py-3`}><Save size={14} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
      </div>
    </div>
  );
}
