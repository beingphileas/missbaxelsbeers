import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { AdminHeader, AdminCard, Field, inputCls, btnPrimary, btnGhost } from './ui';
import SystemHealthCard from './SystemHealthCard';

const DAYS = [
  { k: 'ma', l: 'Maandag' }, { k: 'di', l: 'Dinsdag' }, { k: 'wo', l: 'Woensdag' },
  { k: 'do', l: 'Donderdag' }, { k: 'vr', l: 'Vrijdag' }, { k: 'za', l: 'Zaterdag' },
  { k: 'zo', l: 'Zondag' }, { k: 'feestdagen', l: 'Feestdagen' },
];

interface RestaurantRow {
  id: number; name: string; address: string | null; city: string; phone: string | null;
  email: string | null; reservation_url: string | null; opening_hours: any;
  description: string | null; story: string | null; instagram_url: string | null;
  facebook_url: string | null; google_maps_url: string | null;
}

export default function RestaurantSection() {
  const [row, setRow] = useState<RestaurantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);

  async function scrape() {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-restaurant');
      if (error) throw error;
      toast.success(`Bijgewerkt: ${(data.updated_fields || []).join(', ') || 'geen velden gevonden'}`);
      const { data: fresh } = await supabase.from('restaurant').select('*').eq('id', 1).maybeSingle();
      if (fresh) setRow(fresh as any);
    } catch (e: any) {
      toast.error(e.message || 'Scrape mislukt');
    } finally { setScraping(false); }
  }

  useEffect(() => {
    supabase.from('restaurant').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      setRow((data as any) || {
        id: 1, name: "Bij Koen & Marijke in 't Nieuw Museum", address: '', city: 'Brugge',
        phone: '', email: '', reservation_url: '', opening_hours: {}, description: '', story: '',
        instagram_url: '', facebook_url: '', google_maps_url: '',
      });
      setLoading(false);
    });
  }, []);

  function update<K extends keyof RestaurantRow>(k: K, v: RestaurantRow[K]) {
    setRow(r => r ? { ...r, [k]: v } : r);
  }
  function updateHours(day: string, value: string) {
    setRow(r => r ? { ...r, opening_hours: { ...(r.opening_hours || {}), [day]: value } } : r);
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase.from('restaurant').upsert({ ...row, id: 1 });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Opgeslagen');
  }

  if (loading || !row) return <p className="text-muted-foreground text-sm">Laden…</p>;

  return (
    <div>
      <SystemHealthCard />
      <AdminHeader title="Restaurant" subtitle="Bij Koen & Marijke" right={
        <div className="flex gap-2">
          <button onClick={scrape} disabled={scraping} className={btnGhost}>
            {scraping ? 'Scrapen…' : 'Scrape restaurantinfo'}
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            <Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Basis</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Naam"><input className={inputCls} value={row.name} onChange={e => update('name', e.target.value)} /></Field>
              <Field label="Stad"><input className={inputCls} value={row.city} onChange={e => update('city', e.target.value)} /></Field>
              <Field label="Adres"><input className={inputCls} value={row.address || ''} onChange={e => update('address', e.target.value)} /></Field>
              <Field label="Telefoon"><input className={inputCls} value={row.phone || ''} onChange={e => update('phone', e.target.value)} /></Field>
              <Field label="E-mail"><input className={inputCls} value={row.email || ''} onChange={e => update('email', e.target.value)} /></Field>
              <Field label="Reservatie URL"><input className={inputCls} value={row.reservation_url || ''} onChange={e => update('reservation_url', e.target.value)} /></Field>
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Verhaal</h3>
            <div className="space-y-4">
              <Field label="Korte omschrijving"><textarea rows={3} className={inputCls} value={row.description || ''} onChange={e => update('description', e.target.value)} /></Field>
              <Field label="Volledig verhaal"><textarea rows={8} className={inputCls} value={row.story || ''} onChange={e => update('story', e.target.value)} /></Field>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Openingsuren</h3>
            <div className="space-y-2">
              {DAYS.map(d => (
                <div key={d.k} className="flex items-center gap-2">
                  <span className="w-[110px] text-[12px] text-muted-foreground">{d.l}</span>
                  <input
                    className={inputCls + ' flex-1 text-[12px]'}
                    placeholder="bv. 12:00–22:00 of gesloten"
                    value={(row.opening_hours?.[d.k] as string) || ''}
                    onChange={e => updateHours(d.k, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <h3 className="font-display text-[15px] mb-4" style={{ fontWeight: 700 }}>Links</h3>
            <div className="space-y-3">
              <Field label="Instagram"><input className={inputCls} value={row.instagram_url || ''} onChange={e => update('instagram_url', e.target.value)} /></Field>
              <Field label="Facebook"><input className={inputCls} value={row.facebook_url || ''} onChange={e => update('facebook_url', e.target.value)} /></Field>
              <Field label="Google Maps"><input className={inputCls} value={row.google_maps_url || ''} onChange={e => update('google_maps_url', e.target.value)} /></Field>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
