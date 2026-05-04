import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

interface BeerEditorProps {
  beerId: string | null;
  onClose: () => void;
}

export default function BeerEditor({ beerId, onClose }: BeerEditorProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [style, setStyle] = useState('');
  const [abv, setAbv] = useState('');
  const [brewedAt, setBrewedAt] = useState('');
  const [description, setDescription] = useState('');
  const [foodPairing, setFoodPairing] = useState('');
  const [flavors, setFlavors] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState<'current' | 'archive'>('current');
  const [featured, setFeatured] = useState(false);
  const [isHiddenGem, setIsHiddenGem] = useState(false);
  const [breweryId, setBreweryId] = useState<string>('');
  const [shopUrl, setShopUrl] = useState('');
  const [source, setSource] = useState<'missbaxel' | 'bierstekers' | 'beide'>('missbaxel');

  useEffect(() => {
    // Default brewery: MissBaxel's
    supabase.from('breweries').select('id').eq('name', "MissBaxel's Beers").single().then(({ data }) => {
      if (data) setBreweryId(data.id);
    });

    if (beerId) {
      supabase.from('beers').select('*').eq('id', beerId).single().then(({ data }) => {
        if (!data) return;
        setName(data.name);
        setStyle(data.style);
        setAbv(String(data.abv ?? ''));
        setBrewedAt(data.brewed_at ?? '');
        setDescription(data.description ?? '');
        setFoodPairing(data.food_pairing ?? '');
        setFlavors((data.flavor_profile ?? []).join(', '));
        setLifecycleStatus((data.lifecycle_status ?? 'current') as 'current' | 'archive');
        setFeatured(data.featured ?? false);
        setIsHiddenGem(data.is_hidden_gem ?? false);
        setBreweryId(data.brewery_id);
        setShopUrl((data as any).shop_url ?? '');
        setSource(((data as any).source ?? 'missbaxel') as any);
      });
    }
  }, [beerId]);

  const handleSave = async () => {
    if (!name.trim() || !style.trim() || !breweryId) {
      toast({ title: 'Vul minstens naam en stijl in', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      style: style.trim(),
      abv: abv ? Number(abv) : null,
      brewed_at: brewedAt.trim() || null,
      description: description.trim() || null,
      food_pairing: foodPairing.trim() || null,
      flavor_profile: flavors.split(',').map(s => s.trim()).filter(Boolean),
      lifecycle_status: lifecycleStatus,
      featured,
      is_hidden_gem: isHiddenGem,
      brewery_id: breweryId,
      shop_url: shopUrl.trim() || null,
      source,
    };

    const { error } = beerId
      ? await supabase.from('beers').update(payload).eq('id', beerId)
      : await supabase.from('beers').insert(payload);

    setSaving(false);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else { toast({ title: beerId ? 'Bier bijgewerkt' : 'Bier toegevoegd' }); onClose(); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <ArrowLeft size={16} /> Terug
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save size={14} /> Opslaan
          </Button>
        </div>

        <div className="space-y-5">
          <div>
            <Label>Naam</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Totetrekkerie" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stijl</Label>
              <Input value={style} onChange={e => setStyle(e.target.value)} placeholder="Saison" />
            </div>
            <div>
              <Label>ABV (%)</Label>
              <Input value={abv} onChange={e => setAbv(e.target.value)} placeholder="6.2" type="number" step="0.1" />
            </div>
          </div>
          <div>
            <Label>Gebrouwen bij / Collab met</Label>
            <Input value={brewedAt} onChange={e => setBrewedAt(e.target.value)} placeholder="Brouwerij X" />
          </div>
          <div>
            <Label>Beschrijving / verhaal</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Smaakprofiel (komma-gescheiden)</Label>
            <Input value={flavors} onChange={e => setFlavors(e.target.value)} placeholder="kruidig, citrus, droog" />
          </div>
          <div>
            <Label>Foodpairing</Label>
            <Input value={foodPairing} onChange={e => setFoodPairing(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Werking / herkomst</Label>
              <Select value={source} onValueChange={(v: any) => setSource(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="missbaxel">MissBaxel's Beers</SelectItem>
                  <SelectItem value="bierstekers">Bierstekers (archief)</SelectItem>
                  <SelectItem value="beide">Beide werkingen</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Bepaalt of dit bier op /bierstekers/archief verschijnt.</p>
            </div>
            <div>
              <Label>Shop-link <span className="text-muted-foreground text-xs">(optioneel)</span></Label>
              <Input
                value={shopUrl}
                onChange={e => setShopUrl(e.target.value)}
                placeholder="https://bierstekers.com/..."
                type="url"
              />
              <p className="text-xs text-muted-foreground mt-1">Enkel tonen indien nog te koop. Anders leeglaten.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div>
              <Label>Status</Label>
              <Select value={lifecycleStatus} onValueChange={(v: any) => setLifecycleStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Huidig assortiment</SelectItem>
                  <SelectItem value="archive">Archief</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label className="mb-0">Featured</Label>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label className="mb-0">Hidden gem</Label>
              <Switch checked={isHiddenGem} onCheckedChange={setIsHiddenGem} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
