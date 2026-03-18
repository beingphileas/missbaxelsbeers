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
import ImageUpload from './ImageUpload';

const PROVINCES = [
  'Antwerpen', 'Brussel', 'Henegouwen', 'Limburg', 'Luik',
  'Luxemburg', 'Namen', 'Oost-Vlaanderen', 'Vlaams-Brabant',
  'Waals-Brabant', 'West-Vlaanderen',
];

const VENUE_TYPES = ['Café', 'Restaurant', 'Bar', 'Brouwerij-tap', 'Biershop', 'Festival'];

interface VenueEditorProps {
  venueId: string | null;
  onClose: () => void;
}

export default function VenueEditor({ venueId, onClose }: VenueEditorProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [province, setProvince] = useState('');
  const [venueType, setVenueType] = useState('Café');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [googleRating, setGoogleRating] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [tripadvisorRating, setTripadvisorRating] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [untappdRating, setUntappdRating] = useState('');
  const [untappdUrl, setUntappdUrl] = useState('');
  const [googleReviewCount, setGoogleReviewCount] = useState('');
  const [tripadvisorReviewCount, setTripadvisorReviewCount] = useState('');
  const [untappdReviewCount, setUntappdReviewCount] = useState('');

  useEffect(() => {
    if (venueId) {
      supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name);
            setAddress(data.address ?? '');
            setLat(String(data.lat));
            setLng(String(data.lng));
            setProvince(data.province);
            setVenueType(data.venue_type);
            setDescription(data.description ?? '');
            setWebsiteUrl(data.website_url ?? '');
            setPhone(data.phone ?? '');
            setEmail(data.email ?? '');
            setIsVerified(data.is_verified);
            setCoverImageUrl(data.cover_image_url ?? '');
            setGoogleRating(data.google_rating != null ? String(data.google_rating) : '');
            setGoogleUrl(data.google_url ?? '');
            setTripadvisorRating(data.tripadvisor_rating != null ? String(data.tripadvisor_rating) : '');
            setTripadvisorUrl(data.tripadvisor_url ?? '');
            setUntappdRating(data.untappd_rating != null ? String(data.untappd_rating) : '');
            setUntappdUrl(data.untappd_url ?? '');
            setGoogleReviewCount(data.google_review_count != null ? String(data.google_review_count) : '');
            setTripadvisorReviewCount(data.tripadvisor_review_count != null ? String(data.tripadvisor_review_count) : '');
            setUntappdReviewCount(data.untappd_review_count != null ? String(data.untappd_review_count) : '');
          }
        });
    }
  }, [venueId]);

  const geocodeAddress = async (addr: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1&countrycodes=be`;
      const res = await fetch(url, { headers: { 'User-Agent': 'MissBaxelsBeers/1.0' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { return null; }
  };

  const handleSave = async () => {
    if (!name.trim() || !province) {
      toast({ title: 'Vul naam en provincie in', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Auto-geocode from address if lat/lng are empty or unchanged defaults
    let finalLat = lat ? parseFloat(lat) : NaN;
    let finalLng = lng ? parseFloat(lng) : NaN;

    if (address.trim() && (isNaN(finalLat) || isNaN(finalLng) || (!venueId && finalLat === 0 && finalLng === 0))) {
      toast({ title: 'Geocoding adres...' });
      const coords = await geocodeAddress(address.trim());
      if (coords) {
        finalLat = coords.lat;
        finalLng = coords.lng;
        setLat(String(coords.lat));
        setLng(String(coords.lng));
        toast({ title: 'Adres gegeocode ✓' });
      } else {
        toast({ title: 'Geocoding mislukt — vul coördinaten handmatig in', variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    if (isNaN(finalLat) || isNaN(finalLng)) {
      toast({ title: 'Vul coördinaten of een geldig adres in', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const venueData = {
      name: name.trim(),
      address: address.trim() || null,
      lat: finalLat,
      lng: finalLng,
      province,
      venue_type: venueType,
      description: description.trim() || null,
      website_url: websiteUrl.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_verified: isVerified,
      cover_image_url: coverImageUrl.trim() || null,
      google_rating: googleRating ? parseFloat(googleRating) : null,
      google_url: googleUrl.trim() || null,
      tripadvisor_rating: tripadvisorRating ? parseFloat(tripadvisorRating) : null,
      tripadvisor_url: tripadvisorUrl.trim() || null,
      untappd_rating: untappdRating ? parseFloat(untappdRating) : null,
      untappd_url: untappdUrl.trim() || null,
      google_review_count: googleReviewCount ? parseInt(googleReviewCount) : null,
      tripadvisor_review_count: tripadvisorReviewCount ? parseInt(tripadvisorReviewCount) : null,
      untappd_review_count: untappdReviewCount ? parseInt(untappdReviewCount) : null,
    };

    let error;
    if (venueId) {
      ({ error } = await supabase.from('venues').update(venueData).eq('id', venueId));
    } else {
      ({ error } = await supabase.from('venues').insert(venueData));
    }

    if (error) {
      toast({ title: 'Fout bij opslaan', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: venueId ? 'Venue bijgewerkt' : 'Venue aangemaakt' });
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
            {venueId ? 'Bijwerken' : 'Opslaan'}
          </Button>
        </div>

        <div className="space-y-5">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Naam van de venue..."
            className="font-serif text-2xl h-14 border-none shadow-none px-0 focus-visible:ring-0"
          />

          <ImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map(t => (
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
            <Label className="text-xs text-muted-foreground">Beschrijving</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Vertel iets over deze venue..." rows={3} />
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
            <Switch checked={isVerified} onCheckedChange={setIsVerified} />
            <Label className="text-sm">Verified by the Whisperer 🏅</Label>
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
                <Label className="text-xs text-muted-foreground">TripAdvisor Rating (0-5)</Label>
                <Input value={tripadvisorRating} onChange={e => setTripadvisorRating(e.target.value)} placeholder="4.0" type="number" step="0.1" min="0" max="5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">TripAdvisor Reviews #</Label>
                <Input value={tripadvisorReviewCount} onChange={e => setTripadvisorReviewCount(e.target.value)} placeholder="156" type="number" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">TripAdvisor URL</Label>
                <Input value={tripadvisorUrl} onChange={e => setTripadvisorUrl(e.target.value)} placeholder="https://tripadvisor.com/..." />
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
                <Input value={untappdUrl} onChange={e => setUntappdUrl(e.target.value)} placeholder="https://untappd.com/v/..." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
