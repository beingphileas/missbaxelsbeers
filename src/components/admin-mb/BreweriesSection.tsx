import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import SystemHealthCard from './SystemHealthCard';
import ImageUploader from './ImageUploader';

interface BreweryRow {
  id: string; name: string; slug: string | null; location: string | null; region: string | null;
  website_url: string | null; description: string | null; image_url: string | null;
  type: string | null; province: string | null; lat: number | null; lng: number | null;
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function BreweriesSection() {
  const [rows, setRows] = useState<BreweryRow[]>([]);
  const [editing, setEditing] = useState<BreweryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('breweries')
      .select('id,name,slug,location,region,website_url,description,image_url,type,province,lat,lng')
      .order('name').limit(1000);
    if (error) toast.error(error.message); else setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Brouwerij verwijderen?')) return;
    const { error } = await supabase.from('breweries').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  if (editing || creating) return <BreweryForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />;

  return (
    <div>
      <SystemHealthCard />
      <AdminHeader title="Brouwerijen" subtitle={`${rows.length} brouwerijen`} right={
        <button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={13} /> Nieuwe brouwerij</button>
      } />
      {loading ? <p className="text-muted-foreground text-sm">Laden…</p> : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Naam</th>
              <th className="px-4 py-2.5 font-medium">Locatie</th>
              <th className="px-4 py-2.5 font-medium">Regio</th>
              <th className="px-4 py-2.5 font-medium text-right">Acties</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.location || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.region || r.province || '—'}</td>
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

function BreweryForm({ initial, onClose, onSaved }: { initial: BreweryRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [region, setRegion] = useState(initial?.region || '');
  const [website, setWebsite] = useState(initial?.website_url || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!initial && name && !slug) setSlug(slugify(name)); }, [name]);

  async function save() {
    if (!name.trim()) return toast.error('Naam is verplicht');
    setSaving(true);
    const payload: any = {
      name: name.trim(), slug: slug.trim() || slugify(name),
      location: location.trim() || null, region: region.trim() || null,
      website_url: website.trim() || null, description: description.trim() || null,
      image_url: imageUrl,
    };
    if (initial) {
      const { error } = await supabase.from('breweries').update(payload).eq('id', initial.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      // Legacy NOT NULL columns: type, province, lat, lng — set safe defaults.
      const { error } = await supabase.from('breweries').insert({
        ...payload, type: 'microbrewery', province: region.trim() || 'Onbekend', lat: 0, lng: 0,
      });
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div>
      <AdminHeader title={initial ? `Bewerken: ${initial.name}` : 'Nieuwe brouwerij'} right={
        <div className="flex gap-2">
          <button onClick={onClose} className={btnGhost}><ArrowLeft size={12} /> Terug</button>
          <button onClick={save} disabled={saving} className={btnPrimary}><Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      } />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AdminCard>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Naam"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field>
              <Field label="Slug"><input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
              <Field label="Locatie (stad)"><input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} /></Field>
              <Field label="Regio / provincie"><input className={inputCls} value={region} onChange={e => setRegion(e.target.value)} /></Field>
              <Field label="Website"><input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></Field>
            </div>
          </AdminCard>
          <AdminCard>
            <Field label="Omschrijving"><textarea rows={6} className={inputCls} value={description} onChange={e => setDescription(e.target.value)} /></Field>
          </AdminCard>
        </div>
        <AdminCard>
          <ImageUploader bucket="brewery-images" value={imageUrl} onChange={setImageUrl} label="Foto / logo" />
        </AdminCard>
      </div>
    </div>
  );
}
