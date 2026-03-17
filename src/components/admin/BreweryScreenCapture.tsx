import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Camera, X, Loader2, Monitor, Plus } from 'lucide-react';
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
  const [captures, setCaptures] = useState<{ dataUrl: string; base64: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const captureScreen = useCallback(async () => {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        preferCurrentTab: false,
      } as any);

      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);

      // Stop stream immediately
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];

      setCaptures((prev) => [...prev, { dataUrl, base64 }]);

      toast({ title: 'Screenshot vastgelegd', description: 'Klik nogmaals om meer te vangen.' });
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast({ title: 'Screen capture mislukt', description: err.message, variant: 'destructive' });
      }
    } finally {
      setCapturing(false);
    }
  }, []);

  const removeCapture = (index: number) => {
    setCaptures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (captures.length === 0) return;

    setLoading(true);
    try {
      const res = await supabase.functions.invoke('scrape-brewery-beers', {
        body: {
          brewery_id: breweryId,
          mode: 'screenshot',
          images: captures.map((c) => c.base64),
        },
      });

      if (res.error) {
        toast({ title: 'Analyse fout', description: res.error.message, variant: 'destructive' });
        return;
      }

      const data = res.data;
      if (!data.beers || data.beers.length === 0) {
        toast({
          title: `${breweryName}: geen bieren gevonden`,
          description: `${captures.length} screenshot(s) geanalyseerd.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `${breweryName}: ${data.beers.length} bieren gevonden`,
        description: `Via ${captures.length} screen capture(s)`,
      });

      onBeersFound(data.beers);
      setOpen(false);
      setCaptures([]);
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Monitor size={12} />
          Capture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Screen Capture — {breweryName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Vang een browser-tabblad met de bierkaart of website. Je kunt meerdere
          screenshots maken — AI extraheert automatisch alle bieren.
        </p>

        {/* Capture button */}
        <Button
          variant="outline"
          className="gap-2 w-full border-dashed border-2 h-14"
          onClick={captureScreen}
          disabled={capturing || loading}
        >
          {capturing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : captures.length > 0 ? (
            <Plus size={16} />
          ) : (
            <Camera size={16} />
          )}
          {capturing
            ? 'Selecteer een tabblad…'
            : captures.length > 0
              ? 'Nog een tabblad vangen'
              : 'Browser-tabblad vastleggen'}
        </Button>

        {/* Preview grid */}
        {captures.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {captures.map((cap, i) => (
              <div key={i} className="relative group">
                <img
                  src={cap.dataUrl}
                  alt={`Capture ${i + 1}`}
                  className="w-full h-24 object-cover rounded-md border border-border"
                />
                <button
                  onClick={() => removeCapture(i)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        {captures.length > 0 && (
          <Button
            className="gap-1.5 w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            Analyseer {captures.length} capture{captures.length > 1 ? 's' : ''}
          </Button>
        )}

        {loading && (
          <p className="text-xs text-muted-foreground animate-pulse text-center">
            AI analyseert screenshots… dit kan even duren.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
