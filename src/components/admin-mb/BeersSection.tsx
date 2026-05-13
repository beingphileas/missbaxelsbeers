import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, CheckCircle2, ArrowLeft, X, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import SystemHealthCard from './SystemHealthCard';
import ImageUploader from './ImageUploader';

interface BeerRow {
  id: string; name: string; slug: string | null; style: string | null; style_category: string | null;
  abv: number | null; description: string | null; marijke_idea: string | null; brew_story: string | null;
  flavor_profile: string[] | null; pairing_suggestion: string | null; image_url: string | null; label_url: string | null;
  is_current: boolean | null; featured: boolean; is_collab: boolean | null; release_date: string | null;
}
interface BreweryRef { id: string; name: string }
interface Link { brewery_id: string; role: string }

const STYLE_CATEGORIES = ['tripel','saison','donker','zuur','wit','speciaal'];

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function BeersSection() {
  const [rows, setRows] = useState<BeerRow[]>([]);
  const [editing, setEditing] = useState<BeerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('beers')
      .select('id,name,slug,style,style_category,abv,description,marijke_idea,brew_story,flavor_profile,pairing_suggestion,image_url,label_url,is_current,featured,is_collab,release_date')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) toast.error(error.message); else setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(id: string, field: 'is_current' | 'featured', value: boolean) {
    const { error } = await supabase.from('beers').update({ [field]: value }).eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  }
  async function remove(id: string) {
    if (!confirm('Dit bier verwijderen?')) return;
    const { error } = await supabase.from('beers').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== id));
    toast.success('Verwijderd');
  }

  if (editing || creating) {
    return <BeerForm
      initial={editing}
      onClose={() => { setEditing(null); setCreating(false); }}
      onSaved={() => { setEditing(null); setCreating(false); load(); }}
    />;
  }

  return (
    <div>
      <SystemHealthCard />
      <AdminHeader
        title="Bieren"
        subtitle={`${rows.length} bieren in de catalogus`}
        right={
          <button onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus size={13} /> Nieuw bier
          </button>
        }
      />

      {!loading && rows.length === 0 && (
        <div className="mb-4 p-4 bg-[hsl(var(--primary-light))] border border-[hsl(var(--primary))]/20 rounded-[12px]">
          <p className="text-[13px] text-foreground">
            <strong>Nog geen bieren toegevoegd.</strong> Voeg de MissBaxel's bieren hier handmatig toe — inclusief brouwer, beschrijving, Marijke's idee en smaakprofiel.
          </p>
        </div>
      )}

      {loading ? <p className="text-muted-foreground text-sm">Laden…</p> : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Naam</th>
                <th className="px-4 py-2.5 font-medium">Stijl</th>
                <th className="px-4 py-2.5 font-medium">ABV</th>
                <th className="px-4 py-2.5 font-medium">Huidig</th>
                <th className="px-4 py-2.5 font-medium">Featured</th>
                <th className="px-4 py-2.5 font-medium text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.style || '—'}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.abv != null ? `${r.abv}%` : '—'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggle(r.id, 'is_current', !r.is_current)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${r.is_current ? 'bg-[hsl(var(--primary-light))] text-primary' : 'border border-border text-muted-foreground'}`}>
                      <CheckCircle2 size={11} /> {r.is_current ? 'Huidig' : 'Archief'}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggle(r.id, 'featured', !r.featured)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${r.featured ? 'bg-[hsl(var(--secondary-light))] text-[hsl(var(--secondary))]' : 'border border-border text-muted-foreground'}`}>
                      <Star size={11} /> {r.featured ? 'Uitgelicht' : 'Nee'}
                    </button>
                  </td>
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

function BeerForm({ initial, onClose, onSaved }: { initial: BeerRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [style, setStyle] = useState(initial?.style || '');
  const [styleCat, setStyleCat] = useState(initial?.style_category || '');
  const [abv, setAbv] = useState(initial?.abv?.toString() || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [marijkeIdea, setMarijkeIdea] = useState(initial?.marijke_idea || '');
  const [brewStory, setBrewStory] = useState(initial?.brew_story || '');
  const [flavorTags, setFlavorTags] = useState((initial?.flavor_profile || []).join(', '));
  const [pairing, setPairing] = useState(initial?.pairing_suggestion || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || null);
  const [labelUrl, setLabelUrl] = useState(initial?.label_url || null);
  const [isCurrent, setIsCurrent] = useState(initial?.is_current ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.featured ?? false);
  const [isCollab, setIsCollab] = useState(initial?.is_collab ?? false);
  const [releaseDate, setReleaseDate] = useState(initial?.release_date || '');

  const [breweries, setBreweries] = useState<BreweryRef[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('breweries').select('id,name').order('name').then(({ data }) => {
      setBreweries((data as any) || []);
    });
    if (initial) {
      supabase.from('beer_breweries').select('brewery_id,role').eq('beer_id', initial.id)
        .then(({ data }) => setLinks((data as any) || []));
    }
  }, [initial?.id]);

  useEffect(() => { if (!initial && name && !slug) setSlug(slugify(name)); }, [name]);

  async function save() {
    if (!name.trim()) return toast.error('Naam is verplicht');
    setSaving(true);
    const payload: any = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      style: style.trim() || null,
      style_category: styleCat || null,
      abv: abv ? Number(abv) : null,
      description: description.trim() || null,
      marijke_idea: marijkeIdea.trim() || null,
      brew_story: brewStory.trim() || null,
      flavor_profile: flavorTags.split(',').map(t => t.trim()).filter(Boolean),
      pairing_suggestion: pairing.trim() || null,
      image_url: imageUrl,
      label_url: labelUrl,
      is_current: isCurrent,
      featured: isFeatured,
      is_collab: isCollab,
      release_date: releaseDate || null,
    };

    let beerId = initial?.id;
    if (initial) {
      const { error } = await supabase.from('beers').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      // Need a brewery_id for the legacy NOT NULL column — pick first link or any brewery
      const fallbackBrewery = links[0]?.brewery_id || breweries[0]?.id;
      if (!fallbackBrewery) { setSaving(false); return toast.error('Voeg eerst een brouwerij toe'); }
      const { data, error } = await supabase.from('beers').insert({ ...payload, brewery_id: fallbackBrewery }).select('id').single();
      if (error) { setSaving(false); return toast.error(error.message); }
      beerId = data.id;
    }

    if (beerId) {
      await supabase.from('beer_breweries').delete().eq('beer_id', beerId);
      if (links.length) {
        const { error } = await supabase.from('beer_breweries').insert(
          links.map(l => ({ beer_id: beerId!, brewery_id: l.brewery_id, role: l.role }))
        );
        if (error) toast.error('Brouwerij-links: ' + error.message);
      }
    }

    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div>
      <AdminHeader
        title={initial ? `Bewerken: ${initial.name}` : 'Nieuw bier'}
        right={
          <div className="flex gap-2">
            <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
            <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Basis</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Naam"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field>
              <Field label="Slug"><input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
              <Field label="Stijl (vrij tekst)"><input className={inputCls} value={style} onChange={e => setStyle(e.target.value)} placeholder="Tripel, Saison …" /></Field>
              <Field label="Stijl-categorie">
                <select className={inputCls} value={styleCat} onChange={e => setStyleCat(e.target.value)}>
                  <option value="">—</option>
                  {STYLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="ABV %"><input type="number" step="0.1" className={inputCls} value={abv} onChange={e => setAbv(e.target.value)} /></Field>
              <Field label="Release datum"><input type="date" className={inputCls} value={releaseDate} onChange={e => setReleaseDate(e.target.value)} /></Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Verhaal</h3>
            <div className="space-y-4">
              <Field label="Korte omschrijving"><textarea rows={2} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} /></Field>
              <Field label="Marijke's idee" hint="Het oorspronkelijke idee, de inspiratie."><textarea rows={3} className={inputCls} value={marijkeIdea} onChange={e => setMarijkeIdea(e.target.value)} /></Field>
              <Field label="Brouw-verhaal"><textarea rows={5} className={inputCls} value={brewStory} onChange={e => setBrewStory(e.target.value)} /></Field>
              <Field label="Smaak-tags" hint="Komma-gescheiden, bv. citrus, kruidig, bloemig"><input className={inputCls} value={flavorTags} onChange={e => setFlavorTags(e.target.value)} /></Field>
              <Field label="Spijs-bier combinatie"><input className={inputCls} value={pairing} onChange={e => setPairing(e.target.value)} /></Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Brouwerijen</h3>
            <BrewerySelector breweries={breweries} links={links} onChange={setLinks} />
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Beelden</h3>
            <div className="space-y-4">
              <ImageUploader bucket="beer-images" value={imageUrl} onChange={setImageUrl} label="Foto" />
              <ImageUploader bucket="beer-images" value={labelUrl} onChange={setLabelUrl} label="Etiket" />
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Vlaggen</h3>
            <div className="space-y-2">
              {[
                { k: 'isCurrent', l: 'Huidig (is_current)', v: isCurrent, set: setIsCurrent },
                { k: 'isFeatured', l: 'Uitgelicht (featured)', v: isFeatured, set: setIsFeatured },
                { k: 'isCollab', l: 'Co-creatie (is_collab)', v: isCollab, set: setIsCollab },
              ].map(f => (
                <label key={f.k} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={f.v} onChange={e => f.set(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  <span>{f.l}</span>
                </label>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function BrewerySelector({ breweries, links, onChange }: { breweries: BreweryRef[]; links: Link[]; onChange: (l: Link[]) => void }) {
  const [pick, setPick] = useState('');
  const [role, setRole] = useState<'main' | 'co-brewer'>('main');
  const nameOf = (id: string) => breweries.find(b => b.id === id)?.name || id;

  function add() {
    if (!pick) return;
    if (links.some(l => l.brewery_id === pick)) return toast.error('Al toegevoegd');
    onChange([...links, { brewery_id: pick, role }]);
    setPick('');
  }
  function update(id: string, newRole: string) {
    onChange(links.map(l => l.brewery_id === id ? { ...l, role: newRole } : l));
  }
  function remove(id: string) { onChange(links.filter(l => l.brewery_id !== id)); }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {links.length === 0 && <p className="text-[12px] text-muted-foreground italic">Nog geen brouwerijen gekoppeld.</p>}
        {links.map(l => (
          <div key={l.brewery_id} className="flex items-center gap-2 p-2 border border-border rounded-[8px]">
            <span className="flex-1 text-[13px] font-medium">{nameOf(l.brewery_id)}</span>
            <select value={l.role} onChange={e => update(l.brewery_id, e.target.value)} className="text-[12px] border border-border rounded-full px-2 py-1 bg-card">
              <option value="main">Hoofdbrouwer</option>
              <option value="co-brewer">Co-brouwer</option>
            </select>
            <button onClick={() => remove(l.brewery_id)} className="text-muted-foreground hover:text-[hsl(var(--tertiary))]"><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        <select value={pick} onChange={e => setPick(e.target.value)} className={inputCls + ' flex-1'}>
          <option value="">— Kies brouwerij —</option>
          {breweries.filter(b => !links.some(l => l.brewery_id === b.id)).map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={role} onChange={e => setRole(e.target.value as any)} className="text-[12px] border border-border rounded-[8px] px-2 bg-card">
          <option value="main">Hoofd</option>
          <option value="co-brewer">Co</option>
        </select>
        <button onClick={add} className={btnGhost}><Plus size={12} /> Voeg toe</button>
      </div>
    </div>
  );
}
