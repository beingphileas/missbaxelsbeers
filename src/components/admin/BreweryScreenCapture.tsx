import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Camera, X, Loader2, Monitor, Plus, Scan, Square } from 'lucide-react';
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
  const [scanning, setScanning] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopScan = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  useEffect(() => {
    if (!open) stopScan();
    return () => stopScan();
  }, [open, stopScan]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const maxWidth = 1440;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const base64 = dataUrl.split(',')[1];

    setCaptures((prev) => {
      const last = prev[prev.length - 1];
      if (last?.base64 === base64) return prev;
      return [...prev, { dataUrl, base64 }];
    });
  }, []);

  const startScan = useCallback(async () => {
    setCapturing(true);

    try {
      stopScan();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: false,
      } as any);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);
      captureFrame();

      intervalRef.current = window.setInterval(() => {
        captureFrame();
      }, 1500);

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener('ended', () => {
          stopScan();
          toast({ title: 'Scan gestopt', description: 'Delen van tabblad werd beëindigd.' });
        });
      }

      toast({
        title: 'Live scan gestart',
        description: 'Scroll door de volledige pagina; frames worden automatisch verzameld.',
      });
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast({ title: 'Screen capture mislukt', description: err.message, variant: 'destructive' });
      }
    } finally {
      setCapturing(false);
    }
  }, [captureFrame, stopScan]);

  const addManualFrame = useCallback(() => {
    if (!scanning) return;
    captureFrame();
    toast({ title: 'Extra frame toegevoegd', description: 'Handmatige snapshot opgeslagen.' });
  }, [captureFrame, scanning]);

  const removeCapture = (index: number) => {
    setCaptures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (captures.length === 0) return;

    stopScan();
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
          description: `${captures.length} frame(s) geanalyseerd.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `${breweryName}: ${data.beers.length} bieren gevonden`,
        description: `Via ${captures.length} frame(s)`,
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
          Start een live scan, kies je browser-tabblad en scroll door de volledige pagina.
          We nemen automatisch meerdere frames op (ook content die eerst buiten beeld stond).
        </p>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-md border border-border bg-muted aspect-video"
        />

        {!scanning ? (
          <Button
            variant="outline"
            className="gap-2 w-full border-dashed border-2 h-14"
            onClick={startScan}
            disabled={capturing || loading}
          >
            {capturing ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
            {capturing ? 'Tabblad selecteren…' : 'Start volledige paginascan'}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2" onClick={addManualFrame} disabled={loading}>
              <Plus size={16} />
              Extra frame
            </Button>
            <Button variant="destructive" className="gap-2" onClick={stopScan} disabled={loading}>
              <Square size={16} />
              Stop scan
            </Button>
          </div>
        )}

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

        {captures.length > 0 && (
          <Button className="gap-1.5 w-full" onClick={handleSubmit} disabled={loading || capturing}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            Analyseer {captures.length} frame{captures.length > 1 ? 's' : ''}
          </Button>
        )}

        {(loading || scanning) && (
          <p className="text-xs text-muted-foreground animate-pulse text-center">
            {loading
              ? 'AI analyseert frames… dit kan even duren.'
              : `Live scan actief — ${captures.length} frame(s) verzameld.`}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
