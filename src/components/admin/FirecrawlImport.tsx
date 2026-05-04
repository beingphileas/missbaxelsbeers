import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Download, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function FirecrawlImport() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleScrape = async () => {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error('Voer een geldige URL in (bv. https://untappd.com/...)');
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        'scrape-beer-firecrawl',
        { body: { url: trimmed } },
      );

      if (error) {
        toast.error('Scrape mislukt', { description: error.message });
        return;
      }
      if (data?.error) {
        toast.error('Scrape mislukt', { description: data.error });
        return;
      }

      setLastResult(data);
      toast.success(
        data.action === 'updated'
          ? `Bier bijgewerkt: ${data.data?.name}`
          : `Bier toegevoegd: ${data.data?.name}`,
      );
      setUrl('');
      queryClient.invalidateQueries({ queryKey: ['beers'] });
    } catch (e: any) {
      toast.error('Onverwachte fout', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles size={14} className="text-accent" />
        <span>
          Plak een Untappd / RateBeer / brouwerij-link en laat AI de bierdata
          ophalen.
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="firecrawl-url">URL</Label>
        <div className="flex gap-2">
          <Input
            id="firecrawl-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://untappd.com/b/..."
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleScrape();
            }}
          />
          <Button
            onClick={handleScrape}
            disabled={loading || !url.trim()}
            className="gap-1.5 shrink-0"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {loading ? 'Bezig…' : 'Scrape & Importeer'}
          </Button>
        </div>
      </div>

      {lastResult?.data && (
        <div className="border border-border/60 rounded-md p-4 bg-card text-sm space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-base">
              {lastResult.data.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-accent font-bold">
              {lastResult.action === 'updated' ? 'Bijgewerkt' : 'Nieuw'}
            </span>
          </div>
          <Row label="Stijl" value={lastResult.data.style} />
          <Row
            label="ABV"
            value={lastResult.data.abv ? `${lastResult.data.abv}%` : '—'}
          />
          <Row
            label="Gebrouwen bij"
            value={lastResult.data.brewed_at ?? '—'}
          />
          {lastResult.data.description && (
            <p className="text-xs text-muted-foreground italic mt-2 line-clamp-3">
              {lastResult.data.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
