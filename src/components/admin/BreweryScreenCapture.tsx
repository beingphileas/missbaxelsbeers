import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Camera, X, Loader2, Monitor, Plus, Scan, Square, Link, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [urlInput, setUrlInput] = useState('');

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
      intervalRef.current = window.setInterval(captureFrame, 1500);

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
    toast({ title: 'Extra frame toegevoegd' });
  }, [captureFrame, scanning]);

  const removeCapture = (index: number) => {
    setCaptures((prev) => prev.filter((_, i) => i !== index));
  };

  // === URL MODE: just send a URL, backend does everything ===
  const handleUrlSubmit = async () => {
    const url = urlInput.trim();
    if (!url) return;

    setLoading(true);
    try {
      const res = await supabase.functions.invoke('scrape-brewery-beers', {
        body: {
          brewery_id: breweryId,
          mode: 'url',
          scan_url: url,
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
          description: `URL geanalyseerd maar geen bieren gevonden.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `${breweryName}: ${data.beers.length} bieren gevonden`,
        description: `Via URL scan`,
      });

      onBeersFound(data.beers);
      setOpen(false);
      setUrlInput('');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // === SCREENSHOT MODE: send captured frames ===
  const handleScreenshotSubmit = async () => {
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
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Beer Scan — {breweryName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="url" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="url" className="gap-1.5">
              <Globe size={14} />
              Paste URL
            </TabsTrigger>
            <TabsTrigger value="capture" className="gap-1.5">
              <Monitor size={14} />
              Screen Capture
            </TabsTrigger>
          </TabsList>

          {/* === URL TAB === */}
          <TabsContent value="url" className="flex-1 flex flex-col gap-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Plak een URL (bijv. Untappd, RateBeer, eigen website) en wij scrapen en analyseren
              de volledige pagina automatisch — geen handmatig scrollen nodig.
            </p>

            <Input
              placeholder="https://untappd.com/w/brewery-name/12345"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />

            <Button
              className="gap-1.5 w-full"
              onClick={handleUrlSubmit}
              disabled={loading || !urlInput.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
              {loading ? 'Pagina wordt gescraped en geanalyseerd…' : 'Scan URL'}
            </Button>

            {loading && (
              <p className="text-xs text-muted-foreground animate-pulse text-center">
                Firecrawl scraped de pagina en AI analyseert de content… dit kan 20-60 sec duren.
              </p>
            )}
          </TabsContent>

          {/* === SCREEN CAPTURE TAB === */}
          <TabsContent value="capture" className="flex-1 flex flex-col overflow-hidden mt-3">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs text-muted-foreground">
                Fallback: deel je browser-tabblad en scroll handmatig door de pagina.
              </p>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-md border border-border bg-muted aspect-video"
              />

              {captures.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {captures.map((cap, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={cap.dataUrl}
                        alt={`Capture ${i + 1}`}
                        className="w-full h-16 object-cover rounded border border-border"
                      />
                      <button
                        onClick={() => removeCapture(i)}
                        className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border shrink-0">
              {!scanning ? (
                <Button
                  variant="outline"
                  className="gap-2 w-full border-dashed border-2 h-12"
                  onClick={startScan}
                  disabled={capturing || loading}
                >
                  {capturing ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                  {capturing ? 'Tabblad selecteren…' : 'Start screen capture'}
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2" onClick={addManualFrame} disabled={loading}>
                    <Plus size={16} />
                    Extra frame
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={stopScan} disabled={loading}>
                    <Square size={16} />
                    Stop
                  </Button>
                </div>
              )}

              {captures.length > 0 && (
                <Button className="gap-1.5 w-full" onClick={handleScreenshotSubmit} disabled={loading || capturing}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  Analyseer {captures.length} frame{captures.length > 1 ? 's' : ''}
                </Button>
              )}

              {(loading || scanning) && (
                <p className="text-xs text-muted-foreground animate-pulse text-center">
                  {loading
                    ? 'AI analyseert frames…'
                    : `Live scan — ${captures.length} frame(s) verzameld.`}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
