import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Download, Sparkles, Search, Wand2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function FirecrawlImport() {
  const [url, setUrl] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bulking, setBulking] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['beers'] });

  const handleScrape = async () => {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error('Voer een geldige URL in (bv. https://untappd.com/...)');
      return;
    }
    setLoading(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-beer-firecrawl', {
        body: { url: trimmed },
      });
      if (error) return toast.error('Scrape mislukt', { description: error.message });
      if (data?.error) return toast.error('Scrape mislukt', { description: data.error });
      setLastResult(data);
      toast.success(
        data.action === 'updated'
          ? `Bier bijgewerkt: ${data.data?.name}`
          : `Bier toegevoegd: ${data.data?.name}`,
      );
      setUrl('');
      invalidate();
    } catch (e: any) {
      toast.error('Onverwachte fout', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return toast.error('Geef een biernaam op');
    setSearching(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('search-beer-firecrawl', {
        body: { query: q },
      });
      if (error) return toast.error('Zoeken mislukt', { description: error.message });
      if (data?.error) return toast.error('Niet gevonden', { description: data.error });
      setLastResult(data);
      toast.success(
        `${data.action === 'updated' ? 'Bijgewerkt' : 'Toegevoegd'}: ${data.data?.name}`,
      );
      setQuery('');
      invalidate();
    } catch (e: any) {
      toast.error('Onverwachte fout', { description: e?.message });
    } finally {
      setSearching(false);
    }
  };

  const handleBulkEnrich = async () => {
    setBulking(true);
    setBulkResults(null);
    toast.info('Bulk verrijking gestart… dit kan even duren.');
    try {
      const { data, error } = await supabase.functions.invoke('enrich-beers-bulk', {
        body: { onlyMissing: true, limit: 10 },
      });
      if (error) return toast.error('Bulk mislukt', { description: error.message });
      if (data?.error) return toast.error('Bulk mislukt', { description: data.error });
      setBulkResults(data.results ?? []);
      const updated = (data.results ?? []).filter((r: any) => r.status === 'updated').length;
      toast.success(`${updated}/${data.processed} bieren verrijkt`);
      invalidate();
    } catch (e: any) {
      toast.error('Onverwachte fout', { description: e?.message });
    } finally {
      setBulking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search by name */}
      <section className="space-y-2 border border-border/60 rounded-md p-4 bg-card/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Search size={14} className="text-accent" />
          <span>Zoek op biernaam (auto Untappd)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Typ alleen de biernaam — we zoeken zelf de Untappd-pagina en importeren.
        </p>
        <div className="flex gap-2 pt-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="bv. Pils of Belgian Trippel"
            disabled={searching}
            onKeyDown={(e) => e.key === 'Enter' && !searching && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-1.5 shrink-0">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {searching ? 'Zoeken…' : 'Zoek & Importeer'}
          </Button>
        </div>
      </section>

      {/* Direct URL */}
      <section className="space-y-2 border border-border/60 rounded-md p-4 bg-card/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={14} className="text-accent" />
          <span>Plak een directe link</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Untappd / RateBeer / brouwerij-link → bierdata wordt opgehaald.
        </p>
        <div className="flex gap-2 pt-1">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://untappd.com/b/..."
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleScrape()}
          />
          <Button onClick={handleScrape} disabled={loading || !url.trim()} className="gap-1.5 shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {loading ? 'Bezig…' : 'Importeer'}
          </Button>
        </div>
      </section>

      {/* Bulk enrich */}
      <section className="space-y-2 border border-border/60 rounded-md p-4 bg-card/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Wand2 size={14} className="text-accent" />
          <span>Bulk-verrijking bestaande bieren</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Loopt over bieren met ontbrekende velden (max 10) en vult ze automatisch aan via Untappd.
        </p>
        <Button onClick={handleBulkEnrich} disabled={bulking} variant="secondary" className="gap-1.5 mt-2">
          {bulking ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {bulking ? 'Bezig…' : 'Start bulk-verrijking'}
        </Button>

        {bulkResults && (
          <div className="mt-3 space-y-1 max-h-60 overflow-y-auto text-xs">
            {bulkResults.map((r, i) => (
              <div key={i} className="flex justify-between border-b border-border/30 py-1">
                <span className="truncate">{r.name}</span>
                <span
                  className={
                    r.status === 'updated'
                      ? 'text-accent'
                      : r.status === 'no-url' || r.status === 'no-data'
                        ? 'text-muted-foreground'
                        : 'text-destructive'
                  }
                >
                  {r.status}
                  {r.filled?.length ? ` (${r.filled.join(', ')})` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Last single-import result */}
      {lastResult?.data && (
        <div className="border border-border/60 rounded-md p-4 bg-card text-sm space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-base">{lastResult.data.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-accent font-bold">
              {lastResult.action === 'updated' ? 'Bijgewerkt' : 'Nieuw'}
            </span>
          </div>
          <Row label="Stijl" value={lastResult.data.style} />
          <Row label="ABV" value={lastResult.data.abv ? `${lastResult.data.abv}%` : '—'} />
          <Row label="Gebrouwen bij" value={lastResult.data.brewed_at ?? '—'} />
          {lastResult.source_url && (
            <Row label="Bron" value={lastResult.source_url} />
          )}
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
    <div className="flex justify-between text-xs gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium truncate text-right">{value}</span>
    </div>
  );
}
