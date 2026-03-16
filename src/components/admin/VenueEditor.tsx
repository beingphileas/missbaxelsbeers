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
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [googleRating, setGoogleRating] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [tripadvisorRating, setTripadvisorRating] = useState('');
  const [tripadvisorUrl, setTripadvisorUrl] = useState('');
  const [untappdRating, setUntappdRating] = useState('');
  const [untappdUrl, setUntappdUrl] = useState('');

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
          }
        });
    }
  }, [venueId]);

  const handleSave = async () => {
    if (!name.trim() || !province || !lat || !lng) {
      toast({ title: 'Vul naam, provincie en coördinaten in', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const venueData = {
      name: name.trim(),
      address: address.trim() || null,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      province,
      venue_type: venueType,
      description: description.trim() || null,
      website_url: websiteUrl.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_verified: isVerified,
      cover_image_url: coverImageUrl.trim() || null,
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
        </div>
      </div>
    </div>
  );
}
