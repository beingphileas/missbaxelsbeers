import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BreweryScreenCaptureProps {
  breweryId: string;
  breweryName: string;
  onBeersFound: (beers: any[]) => void;
}

export default function BreweryScreenCapture({
  breweryId,
  breweryName,
  onBeersFound,
}: BreweryScreenCaptureProps) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = await Promise.all(
      files.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          file,
          preview: URL.createObjectURL(file),
          base64,
        };
      })
    );

    setImages((prev) => [...prev, ...newImages]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:...;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (images.length === 0) return;

    setLoading(true);
    try {
      const res = await supabase.functions.invoke('scrape-brewery-beers', {
        body: {
          brewery_id: breweryId,
          mode: 'screenshot',
          images: images.map((img) => img.base64),
        },
      });

      if (res.error) {
        toast({
          title: 'Screenshot analyse fout',
          description: res.error.message,
          variant: 'destructive',
        });
        return;
      }

      const data = res.data;
      if (!data.beers || data.beers.length === 0) {
        toast({
          title: `${breweryName}: geen bieren gevonden`,
          description: `${images.length} screenshot(s) geanalyseerd.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `${breweryName}: ${data.beers.length} bieren gevonden`,
        description: `Via ${images.length} screenshot(s)`,
      });

      onBeersFound(data.beers);
      setOpen(false);
      setImages([]);
    } catch (err: any) {
      toast({
        title: 'Fout',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Camera size={12} />
          Screenshot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Screenshots — {breweryName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Upload foto's van bierkaarten, menu's of webpagina's. AI extraheert
          automatisch alle bieren.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.preview}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-24 object-cover rounded-md border"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-1"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            <Upload size={12} />
            {images.length > 0 ? 'Meer toevoegen' : 'Kies afbeeldingen'}
          </Button>

          {images.length > 0 && (
            <Button
              size="sm"
              className="gap-1.5 flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ImageIcon size={12} />
              )}
              Analyseer {images.length} screenshot{images.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        {loading && (
          <p className="text-xs text-muted-foreground animate-pulse text-center">
            AI analyseert screenshots… dit kan even duren.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
