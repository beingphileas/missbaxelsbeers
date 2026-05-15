import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save, Upload, Sparkles, Copy } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import SystemHealthCard from './SystemHealthCard';
import BlogAssistantPanel from '@/components/admin/BlogAssistantPanel';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
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
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [abv, setAbv] = useState<string>('');
  const [shopCity, setShopCity] = useState<string>('');
  const [shopUrl, setShopUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Rubric + flexible scores
  const initialRubric = isRubricKey(initial?.style_category) ? (initial!.style_category as RubricKey) : null;
  const [rubric, setRubric] = useState<RubricKey | ''>(initialRubric || '');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [subjectName, setSubjectName] = useState<string>('');

  const subjectLabel = (() => {
    if (!rubric) return null;
    if (['proefnotitie', 'hidden_gem', 'bier_en_eten', 'missbaxel_bier'].includes(rubric)) return 'Biernaam';
    if (rubric === 'bioshop') return 'Shopnaam';
    if (rubric === 'biertrip') return 'Locatie';
    if (rubric === 'brouwerij') return 'Brouwerijnaam';
    return null;
  })();

  // Enrichment state
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{ fields: Record<string, { value: any; source: string }>; missing: string[] } | null>(null);
  const [enrichBannerDismissed, setEnrichBannerDismissed] = useState(false);
  const [enrichSources, setEnrichSources] = useState<Record<string, string>>({});
  const enrichTimer = useRef<number | null>(null);

  // Auto-init scores when rubric changes (defaults to 4 if missing)
  useEffect(() => {
    if (!rubric) { setScores({}); return; }
    const def = RUBRICS[rubric];
    setScores(prev => {
      const next: Record<string, number> = {};
      for (const f of def.scores) next[f.key] = prev[f.key] ?? 4;
      return next;
    });
  }, [rubric]);

  useEffect(() => {
    const onR = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => { if (!initial && title && !slug) setSlug(slugify(title)); }, [title]);

  // Load existing post_scores when editing
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
          const s = d.scores || {};
          setScores(s);
          if (s._external) setEnrichResult({ fields: s._external, missing: [] });
        }
      }
      const { data: bp } = await supabase.from('blog_posts').select('cover_image_url').eq('id', initial.id).maybeSingle();
      if (bp?.cover_image_url) setCoverImageUrl(bp.cover_image_url);
    })();
  }, [initial]);

  // Debounced enrichment — uses dedicated subjectName field, not title
  useEffect(() => {
    if (!rubric) return;
    const def = RUBRICS[rubric];
    if (!def.enrichment) return;
    const subj = subjectName.trim();
    if (subj.length < 3) return;
    const trig = def.enrichment.trigger;
    const ready =
      (trig === 'beer_name + brewery_name' && brewery.trim()) ||
      (trig === 'beer_name') ||
      (trig === 'beer_name or brewery_name') ||
      (trig === 'brewery_name') ||
      (trig === 'location_name') ||
      (trig === 'shop_name + shop_city' && shopCity.trim());
    if (!ready) return;
    if (enrichTimer.current) window.clearTimeout(enrichTimer.current);
    enrichTimer.current = window.setTimeout(async () => {
      setEnrichLoading(true);
      try {
        const isBeerRubric = ['proefnotitie', 'hidden_gem', 'bier_en_eten', 'missbaxel_bier'].includes(rubric);
        const { data, error } = await supabase.functions.invoke('enrich-post-context', {
          body: {
            rubric,
            query: {
              beer_name: isBeerRubric ? subj : undefined,
              brewery_name: rubric === 'brouwerij' ? subj : (brewery || undefined),
              shop_name: rubric === 'bioshop' ? subj : undefined,
              shop_city: shopCity || undefined,
              location_name: rubric === 'biertrip' ? subj : undefined,
            },
          },
        });
        if (error) throw error;
        setEnrichResult(data);
        const f = data?.fields || {};
        const sources: Record<string, string> = {};
        const apply = (key: string, setter: (v: string) => void, current: string) => {
          if (!current && f[key]?.value != null) {
            setter(String(f[key].value));
            sources[key] = f[key].source;
          }
        };
        for (const key of def.enrichment!.prefill) {
          if (key === 'style') apply('style', setStyle, style);
          if (key === 'abv') apply('abv', setAbv, abv);
          if (key === 'brewery_name') apply('brewery_name', setBrewery, brewery);
          if (key === 'cover_image_url') apply('cover_image_url', setCoverImageUrl, coverImageUrl);
          if (key === 'shop_city') apply('shop_city', setShopCity, shopCity);
          if (key === 'shop_url') apply('shop_url', setShopUrl, shopUrl);
          if (key === 'website_url') apply('website_url', setExternalUrl, externalUrl);
        }
        setEnrichSources(prev => ({ ...prev, ...sources }));
      } catch (e: any) {
        console.error('enrich error', e);
      } finally {
        setEnrichLoading(false);
      }
    }, 800);
    return () => { if (enrichTimer.current) window.clearTimeout(enrichTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubric, subjectName, brewery, shopCity]);

  const SourceBadge = ({ field, onReject }: { field: string; onReject: () => void }) =>
    enrichSources[field] ? (
      <span className="inline-flex items-center gap-1 ml-2 text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
        via {enrichSources[field]}
        <button type="button" onClick={onReject} className="hover:text-foreground" aria-label="Verwerp">×</button>
      </span>
    ) : null;

  const rejectField = (key: string, setter: (v: string) => void) => {
    setter('');
    setEnrichSources(s => { const n = { ...s }; delete n[key]; return n; });
  };

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
      // Build external scores subset (display_in_scorecard)
      const externalKeys = def.enrichment?.display_in_scorecard ?? [];
      const external: Record<string, { value: any; source: string }> = {};
      for (const k of externalKeys) {
        const f = enrichResult?.fields?.[k];
        if (f && f.value != null) external[k] = f;
      }
      if (def.scores.length > 0 || Object.keys(external).length > 0) {
        const cleanScores: Record<string, any> = {};
        for (const f of def.scores) cleanScores[f.key] = Number(scores[f.key]) || 0;
        if (Object.keys(external).length > 0) cleanScores._external = external;
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
            <Field label="Stijl">
              <div className="flex items-center"><input className={inputCls} value={style} onChange={e => { setStyle(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.style; return n; }); }} /><SourceBadge field="style" onReject={() => rejectField('style', setStyle)} /></div>
            </Field>
            <Field label="Stijl-categorie">
              <select className={inputCls} value={styleCat} onChange={e => setStyleCat(e.target.value)}>
                <option value="">—</option>
                {['tripel','saison','donker','zuur','wit','speciaal'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="ABV (%)">
              <div className="flex items-center"><input className={inputCls} value={abv} onChange={e => { setAbv(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.abv; return n; }); }} placeholder="6.2" /><SourceBadge field="abv" onReject={() => rejectField('abv', setAbv)} /></div>
            </Field>
            <Field label="Stad / locatie">
              <div className="flex items-center"><input className={inputCls} value={shopCity} onChange={e => { setShopCity(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.shop_city; return n; }); }} placeholder="Brugge" /><SourceBadge field="shop_city" onReject={() => rejectField('shop_city', setShopCity)} /></div>
            </Field>
            <Field label="Shop-URL">
              <div className="flex items-center"><input className={inputCls} value={shopUrl} onChange={e => { setShopUrl(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.shop_url; return n; }); }} placeholder="https://…" /><SourceBadge field="shop_url" onReject={() => rejectField('shop_url', setShopUrl)} /></div>
            </Field>
            <Field label="Cover-afbeelding URL">
              <div className="flex items-center"><input className={inputCls} value={coverImageUrl} onChange={e => { setCoverImageUrl(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.cover_image_url; return n; }); }} placeholder="https://…" /><SourceBadge field="cover_image_url" onReject={() => rejectField('cover_image_url', setCoverImageUrl)} /></div>
            </Field>
            <Field label="Externe URL" hint="Link naar originele post of website">
              <div className="flex items-center"><input className={inputCls} value={externalUrl} onChange={e => { setExternalUrl(e.target.value); setEnrichSources(s => { const n = { ...s }; delete n.website_url; return n; }); }} placeholder="https://…" /><SourceBadge field="website_url" onReject={() => rejectField('website_url', setExternalUrl)} /></div>
            </Field>
            <Field label="Emoji (fallback)"><input className={inputCls} value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🍺" /></Field>
          </div>
          <Field label="Excerpt"><textarea rows={2} className={inputCls} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></Field>
          <Field label="Content (markdown)"><textarea rows={10} className={inputCls} value={content} onChange={e => setContent(e.target.value)} /></Field>

          <div className="border-t border-border pt-4 space-y-4">
            <Field label="Rubriek" hint="Bepaalt scorekaart, AI-vragen en draftstructuur">
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

            {subjectLabel && (
              <Field label={subjectLabel} hint="Wordt gebruikt om automatisch extra info op te halen (min. 3 tekens)">
                <input
                  className={inputCls}
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder={subjectLabel}
                />
              </Field>
            )}

            {rubric && enrichResult && Object.keys(enrichResult.fields).length > 0 && !enrichBannerDismissed && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] flex items-start gap-2">
                <Sparkles size={13} className="mt-0.5 text-amber-600 shrink-0" />
                <span className="flex-1">
                  We vonden extra info via {Array.from(new Set(Object.values(enrichResult.fields).map(f => f.source))).join(' & ')} — controleer en pas aan waar nodig.
                </span>
                <button type="button" onClick={() => setEnrichBannerDismissed(true)} className="text-muted-foreground hover:text-foreground">×</button>
              </div>
            )}
            {enrichLoading && (
              <p className="text-[11px] text-muted-foreground italic">Gegevens ophalen…</p>
            )}

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

        {assistantOpen && isDesktop && (
          <aside className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
            <BlogAssistantPanel
              title={title}
              rubric={rubric || undefined}
              enrichment={enrichResult?.fields}
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
              rubric={rubric || undefined}
              enrichment={enrichResult?.fields}
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
