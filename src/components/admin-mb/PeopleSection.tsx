import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost, btnDanger } from './ui';
import ImageUploader from './ImageUploader';
import { ROLE_KEYS, ROLE_LABELS } from '@/lib/editorial';

export interface PersonRow {
  id: string; name: string; slug: string; role: string; brewery_id: string | null;
  bio: string | null; photo_url: string | null; location: string | null; website_url: string | null;
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const db = supabase as any;

export default function PeopleSection() {
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [breweries, setBreweries] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: br }] = await Promise.all([
      db.from('people').select('*').order('name'),
      supabase.from('breweries').select('id,name').order('name').range(0, 999),
    ]);
    if (error) toast.error(error.message); else setRows(data || []);
    setBreweries(br || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Persoon verwijderen?')) return;
    const { error } = await db.from('people').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.filter(r => r.id !== id));
  }

  if (editing || creating) return (
    <PersonForm initial={editing} breweries={breweries}
      onClose={() => { setEditing(null); setCreating(false); }}
      onSaved={() => { setEditing(null); setCreating(false); load(); }} />
  );

  const brewName = (id: string | null) => breweries.find(b => b.id === id)?.name || '—';

  return (
    <div>
      <AdminHeader title="Mensen" subtitle={`${rows.length} personen`} right={
        <button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={13} /> Nieuwe persoon</button>
      } />
      {loading ? <p className="text-muted-foreground text-sm">Laden…</p> : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead><tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Naam</th>
              <th className="px-4 py-2.5 font-medium">Rol</th>
              <th className="px-4 py-2.5 font-medium">Brouwerij</th>
              <th className="px-4 py-2.5 font-medium">Locatie</th>
              <th className="px-4 py-2.5 font-medium text-right">Acties</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{ROLE_LABELS[r.role] || r.role}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{brewName(r.brewery_id)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.location || '—'}</td>
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

function PersonForm({ initial, breweries, onClose, onSaved }: {
  initial: PersonRow | null; breweries: { id: string; name: string }[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [role, setRole] = useState(initial?.role || 'brewer');
  const [breweryId, setBreweryId] = useState(initial?.brewery_id || '');
  const [bio, setBio] = useState(initial?.bio || '');
  const [photo, setPhoto] = useState<string | null>(initial?.photo_url || null);
  const [location, setLocation] = useState(initial?.location || '');
  const [website, setWebsite] = useState(initial?.website_url || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!initial && name) setSlug(slugify(name)); }, [name]);

  async function save() {
    if (!name.trim()) return toast.error('Naam is verplicht');
    setSaving(true);
    const payload = {
      name: name.trim(), slug: slug.trim() || slugify(name), role,
      brewery_id: breweryId || null, bio: bio.trim() || null, photo_url: photo,
      location: location.trim() || null, website_url: website.trim() || null,
    };
    const { error } = initial
      ? await db.from('people').update(payload).eq('id', initial.id)
      : await db.from('people').insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? 'Opgeslagen' : 'Aangemaakt');
    onSaved();
  }

  return (
    <div>
      <AdminHeader title={initial ? `Bewerken: ${initial.name}` : 'Nieuwe persoon'} right={
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
              <Field label="Rol">
                <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
                  {ROLE_KEYS.map(k => <option key={k} value={k}>{ROLE_LABELS[k]}</option>)}
                </select>
              </Field>
              <Field label="Brouwerij">
                <select className={inputCls} value={breweryId} onChange={e => setBreweryId(e.target.value)}>
                  <option value="">—</option>
                  {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Locatie"><input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} /></Field>
              <Field label="Website"><input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></Field>
            </div>
          </AdminCard>
          <AdminCard>
            <Field label="Bio"><textarea rows={6} className={inputCls} value={bio} onChange={e => setBio(e.target.value)} /></Field>
          </AdminCard>
        </div>
        <AdminCard>
          <ImageUploader bucket="blog-images" value={photo} onChange={setPhoto} label="Foto" />
        </AdminCard>
      </div>
    </div>
  );
}
