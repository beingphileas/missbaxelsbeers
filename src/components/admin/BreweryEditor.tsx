import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

const PROVINCES = [
  'Antwerp', 'Brussels', 'East Flanders', 'Flemish Brabant',
  'Hainaut', 'Liège', 'Limburg', 'Luxembourg',
  'Namur', 'Walloon Brabant', 'West Flanders',
];

const BREWERY_TYPES = ['Microbrewery', 'Family-owned', 'Trappist', 'Industrial', 'Brewpub', 'Contract'];

interface BreweryEditorProps {
  breweryId: string | null;
  onClose: () => void;
}

export default function BreweryEditor({ breweryId, onClose }: BreweryEditorProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Microbrewery');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [story, setStory] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [featured, setFeatured] = useState(false);

  // Ratings
  const [googleRating, setGoogleRating] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googleReviewCount, setGoogleReviewCount] = useState('');
  const [untappdRating, setUntappdRating] = useState('');
  const [untappdUrl, setUntappdUrl] = useState('');
  const [untappdReviewCount, setUntappdReviewCount] = useState('');

  useEffect(() => {
    if (breweryId) {
      supabase
        .from('breweries')
        .select('*')
        .eq('id', breweryId)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name);
            setType(data.type);
            setProvince(data.province);
            setAddress(data.address ?? '');
            setLat(String(data.lat));
            setLng(String(data.lng));
            setPhone(data.phone ?? '');
            setEmail(data.email ?? '');
            setWebsiteUrl(data.website_url ?? '');
            setStory(data.story ?? '');
            setEstablishedYear(data.established_year != null ? String(data.established_year) : '');
            setFeatured(data.featured);
            setGoogleRating((data as any).google_rating != null ? String((data as any).google_rating) : '');
            setGoogleUrl((data as any).google_url ?? '');
            setGoogleReviewCount((data as any).google_review_count != null ? String((data as any).google_review_count) : '');
            setUntappdRating((data as any).untappd_rating != null ? String((data as any).untappd_rating) : '');
            setUntappdUrl((data as any).untappd_url ?? '');
            setUntappdReviewCount((data as any).untappd_review_count != null ? String((data as any).untappd_review_count) : '');
          }
        });
    }
  }, [breweryId]);

  const handleSave = async () => {
    if (!name.trim() || !province || !type) {
      toast({ title: 'Vul naam, type en provincie in', variant: 'destructive' });
      return;
    }

    setSaving(true);

    let finalLat = lat ? parseFloat(lat) : NaN;
    let finalLng = lng ? parseFloat(lng) : NaN;

    // Auto-geocode if no coords
    if (address.trim() && (isNaN(finalLat) || isNaN(finalLng))) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1&countrycodes=be`;
        const res = await fetch(url, { headers: { 'User-Agent': 'MissBaxelsBeers/1.0' } });
        const data = await res.json();
        if (data.length > 0) {
          finalLat = parseFloat(data[0].lat);
          finalLng = parseFloat(data[0].lon);
          setLat(String(finalLat));
          setLng(String(finalLng));
        }
      } catch { /* ignore */ }
    }

    if (isNaN(finalLat) || isNaN(finalLng)) {
      toast({ title: 'Vul coördinaten of een geldig adres in', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const breweryData: Record<string, any> = {
      name: name.trim(),
      type,
      province,
      address: address.trim() || null,
      lat: finalLat,
      lng: finalLng,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website_url: websiteUrl.trim() || null,
      story: story.trim() || null,
      established_year: establishedYear ? parseInt(establishedYear) : null,
      featured,
      google_rating: googleRating ? parseFloat(googleRating) : null,
      google_url: googleUrl.trim() || null,
      google_review_count: googleReviewCount ? parseInt(googleReviewCount) : null,
      untappd_rating: untappdRating ? parseFloat(untappdRating) : null,
      untappd_url: untappdUrl.trim() || null,
      untappd_review_count: untappdReviewCount ? parseInt(untappdReviewCount) : null,
    };

    let error;
    if (breweryId) {
      ({ error } = await supabase.from('breweries').update(breweryData).eq('id', breweryId));
    } else {
      ({ error } = await supabase.from('breweries').insert(breweryData as any));
    }

    if (error) {
      toast({ title: 'Fout bij opslaan', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: breweryId ? 'Brouwerij bijgewerkt' : 'Brouwerij aangemaakt' });
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <ArrowLeft size={16} /> Terug
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save size={14} />
            {breweryId ? 'Bijwerken' : 'Opslaan'}
          </Button>
        </div>

        <div className="space-y-5">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Naam van de brouwerij..."
            className="font-serif text-2xl h-14 border-none shadow-none px-0 focus-visible:ring-0"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BREWERY_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Provincie</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger><SelectValue placeholder="Kies provincie" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Opgericht (jaar)</Label>
              <Input value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} placeholder="1850" type="number" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Adres</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Straat 1, 1000 Stad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input value={lat} onChange={e => setLat(e.target.value)} placeholder="50.8503" type="number" step="any" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input value={lng} onChange={e => setLng(e.target.value)} placeholder="4.3517" type="number" step="any" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Verhaal / beschrijving</Label>
            <Textarea value={story} onChange={e => setStory(e.target.value)} placeholder="Het verhaal van deze brouwerij..." rows={4} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefoon</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32 ..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@..." />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch checked={featured} onCheckedChange={setFeatured} />
            <Label className="text-sm">Featured op homepage</Label>
          </div>

          {/* Ratings */}
          <div className="border-t border-border/50 pt-4 mt-4">
            <h3 className="text-sm font-bold mb-3">Ratings & Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Google Rating (0-5)</Label>
                <Input value={googleRating} onChange={e => setGoogleRating(e.target.value)} placeholder="4.2" type="number" step="0.1" min="0" max="5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Google Reviews #</Label>
                <Input value={googleReviewCount} onChange={e => setGoogleReviewCount(e.target.value)} placeholder="234" type="number" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Google Maps URL</Label>
                <Input value={googleUrl} onChange={e => setGoogleUrl(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Untappd Rating (0-5)</Label>
                <Input value={untappdRating} onChange={e => setUntappdRating(e.target.value)} placeholder="3.8" type="number" step="0.1" min="0" max="5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Untappd Reviews #</Label>
                <Input value={untappdReviewCount} onChange={e => setUntappdReviewCount(e.target.value)} placeholder="89" type="number" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Untappd URL</Label>
                <Input value={untappdUrl} onChange={e => setUntappdUrl(e.target.value)} placeholder="https://untappd.com/..." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
