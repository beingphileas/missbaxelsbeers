import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Beer,
  Link2,
  X,
  Globe,
  Search,
  ShieldCheck,
  Trash2,
  Copy,
} from 'lucide-react';

interface BreweryMatch {
  id: string;
  name: string;
  similarity: number;
}

interface BeerPreview {
  name: string;
  style: string;
  abv: number | null;
  description: string;
  source_url: string;
  image_url: string;
  brewery_input: string;
  brewery_matches: BreweryMatch[];
  brewery_id: string | null;
  _excluded?: boolean;
}

interface BreweryItem {
  id: string;
  name: string;
  website_url: string | null;
  last_scraped_at: string | null;
}

interface BeerImportProps {
  onComplete?: () => void;
}

export default function BeerImport({ onComplete }: BeerImportProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'done'>('input');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [preview, setPreview] = useState<BeerPreview[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [breweries, setBreweries] = useState<BreweryItem[]>([]);
  const [brewerySearch, setBrewerySearch] = useState('');

  // Track multiple simultaneous scrapes & checks
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set());
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [scrapeLog, setScrapeLog] = useState<{ id: string; name: string; found: number; error?: string }[]>([]);

  // Fact-check state
  const [checking, setChecking] = useState<string | null>(null); // brewery id being checked
  const [checkResult, setCheckResult] = useState<{
    brewery_name: string;
    beer_count: number;
    duplicates: { keep_id: string; keep_name: string; remove_ids: string[]; remove_names: string[]; reason: string }[];
    issues: { beer_id: string; beer_name: string; severity: string; message: string }[];
    summary: string;
  } | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      let all: BreweryItem[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase
          .from('breweries')
          .select('id, name, website_url, last_scraped_at')
          .order('name')
          .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data as BreweryItem[]);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      setBreweries(all);
    };
    loadAll();
  }, []);

  const hasWebsite = (b: { website_url: string | null }) =>
    b.website_url && b.website_url.trim().length > 0;

  const filteredBreweries = brewerySearch.length >= 1
    ? breweries
        .filter(b => b.name.toLowerCase().includes(brewerySearch.toLowerCase()) && hasWebsite(b))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 50)
    : breweries
        .filter(b => hasWebsite(b))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 50);

  const formatLastScraped = (value: string | null) => {
    if (!value) return 'Nog niet gescraped';
    return `Laatst gescraped: ${new Date(value).toLocaleString('nl-BE')}`;
  };

  const markBreweryScraped = (breweryId: string) => {
    const now = new Date().toISOString();
    setBreweries(prev => prev.map(b => (b.id === breweryId ? { ...b, last_scraped_at: now } : b)));
  };

  const handleScrapeBrewery = async (breweryId: string, breweryName: string) => {
    setScrapingIds(prev => new Set(prev).add(breweryId));

    try {
      const res = await supabase.functions.invoke('scrape-brewery-beers', {
        body: { brewery_id: breweryId },
      });

      if (res.error) {
        toast({ title: `Scrape fout: ${breweryName}`, description: res.error.message, variant: 'destructive' });
        setScrapeLog(prev => [...prev, { id: breweryId, name: breweryName, found: 0, error: res.error.message }]);
        return;
      }

      markBreweryScraped(breweryId);

      const data = res.data;
      if (!data.beers || data.beers.length === 0) {
        const srcCount = data.sources?.length || 0;
        toast({ title: `${breweryName}: geen bieren`, description: `${srcCount} bronnen doorzocht.`, variant: 'destructive' });
        setScrapeLog(prev => [...prev, { id: breweryId, name: breweryName, found: 0 }]);
        return;
      }

      const previewBeers: BeerPreview[] = data.beers.map((b: any) => ({
        name: b.name,
        style: b.style || '',
        abv: b.abv || null,
        description: b.description || '',
        source_url: b.source_url || '',
        image_url: '',
        brewery_input: breweryName,
        brewery_matches: [{ id: breweryId, name: breweryName, similarity: 100 }],
        brewery_id: breweryId,
        _excluded: false,
        _source: b.source || 'website',
      }));

      const srcNames = (data.sources || []).map((s: any) => s.name).join(', ');
      const rejectedCount = data.rejected?.length || 0;
      // Append to existing preview instead of replacing
      setPreview(prev => [...prev, ...previewBeers]);
      setStep('preview');
      setScrapeLog(prev => [...prev, { id: breweryId, name: breweryName, found: previewBeers.length }]);
      toast({
        title: `${breweryName}: ${previewBeers.length} bieren${data.ai_checked ? ' (AI)' : ''}`,
        description: `Bronnen: ${srcNames || breweryName}${rejectedCount > 0 ? ` · ${rejectedCount} afgekeurd` : ''}`,
      });
    } catch (err: any) {
      toast({ title: `Fout: ${breweryName}`, description: err.message, variant: 'destructive' });
      setScrapeLog(prev => [...prev, { id: breweryId, name: breweryName, found: 0, error: err.message }]);
    } finally {
      setScrapingIds(prev => { const n = new Set(prev); n.delete(breweryId); return n; });
    }
  };

  const handleCheckBrewery = async (breweryId: string) => {
    setCheckingIds(prev => new Set(prev).add(breweryId));
    setCheckResult(null);
    try {
      const res = await supabase.functions.invoke('check-brewery-beers', {
        body: { brewery_id: breweryId },
      });
      if (res.error) {
        toast({ title: 'Check fout', description: res.error.message, variant: 'destructive' });
        return;
      }
      setCheckResult(res.data);
      if (res.data.duplicates?.length === 0 && res.data.issues?.length === 0) {
        toast({ title: `✅ ${res.data.brewery_name}: alles in orde`, description: `${res.data.beer_count} bieren gecheckt, geen problemen.` });
      } else {
        toast({ title: `${res.data.brewery_name}: ${res.data.duplicates?.length || 0} duplicaten, ${res.data.issues?.length || 0} issues` });
      }
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setCheckingIds(prev => { const n = new Set(prev); n.delete(breweryId); return n; });
    }
  };

  const handleDeleteDuplicates = async (removeIds: string[]) => {
    if (!confirm(`Weet je zeker dat je ${removeIds.length} duplica(a)t(en) wilt verwijderen?`)) return;
    const { error } = await supabase.from('beers').delete().in('id', removeIds);
    if (error) {
      toast({ title: 'Fout bij verwijderen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${removeIds.length} duplicaten verwijderd` });
      // Remove from check result
      setCheckResult(prev => prev ? {
        ...prev,
        duplicates: prev.duplicates.filter(d => !d.remove_ids.every(id => removeIds.includes(id))),
        beer_count: prev.beer_count - removeIds.length,
      } : null);
      onComplete?.();
    }
  };

  const parseInput = useCallback((raw: string): any[] => {
    const trimmed = raw.trim();
    // Try JSON
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Try CSV
      const lines = trimmed.split('\n');
      if (lines.length < 2) return [];
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      return lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });
    }
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJsonInput(text);
  };

  const handlePreview = async () => {
    const beers = parseInput(jsonInput);
    if (beers.length === 0) {
      toast({ title: 'Geen data gevonden', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      const res = await supabase.functions.invoke('import-beers', {
        body: { beers, mode: 'preview' },
      });

      setProgress(100);

      if (res.error) {
        toast({ title: 'Preview fout', description: res.error.message, variant: 'destructive' });
        return;
      }

      setPreview(res.data.preview || []);
      setStep('preview');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleExclude = (index: number) => {
    setPreview(prev =>
      prev.map((b, i) => (i === index ? { ...b, _excluded: !b._excluded } : b))
    );
  };

  const setBreweryId = (index: number, breweryId: string) => {
    setPreview(prev =>
      prev.map((b, i) => (i === index ? { ...b, brewery_id: breweryId } : b))
    );
  };

  const handleCommit = async () => {
    const toInsert = preview
      .filter(b => !b._excluded && b.brewery_id)
      .map(b => ({
        name: b.name,
        brewery_id: b.brewery_id,
        style: b.style,
        abv: b.abv,
        description: b.description,
        source_url: b.source_url,
        image_url: b.image_url,
      }));

    if (toInsert.length === 0) {
      toast({ title: 'Geen bieren geselecteerd', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setProgress(30);

    try {
      const res = await supabase.functions.invoke('import-beers', {
        body: { beers: toInsert, mode: 'commit' },
      });

      setProgress(100);

      if (res.error) {
        toast({ title: 'Import fout', description: res.error.message, variant: 'destructive' });
        return;
      }

      setResult(res.data);
      setStep('done');
      toast({ title: 'Import voltooid!' });
      onComplete?.();
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const linkedCount = preview.filter(b => !b._excluded && b.brewery_id).length;
  const unlinkedCount = preview.filter(b => !b._excluded && !b.brewery_id).length;
  const excludedCount = preview.filter(b => b._excluded).length;

  return (
    <div className="space-y-6">
      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Scrape from brewery */}
          <div className="space-y-3">
            <h3 className="font-serif text-base flex items-center gap-2">
              <Globe size={16} className="text-accent" /> Scrape van brouwerij website
            </h3>
            <p className="text-xs text-muted-foreground">
              Zoek een brouwerij en scrape automatisch alle bieren van hun website + belgenbier.be, ratebeer, untappd en meer via AI.
            </p>
             <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={brewerySearch}
                onChange={e => setBrewerySearch(e.target.value)}
                placeholder="Zoek brouwerij op naam..."
                className="pl-9"
              />
            </div>
            {filteredBreweries.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-auto divide-y divide-border">
                {filteredBreweries.map(b => {
                  const isScraping = scrapingIds.has(b.id);
                  const isChecking = checkingIds.has(b.id);
                  return (
                    <div key={b.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{b.website_url}</p>
                        <p className="text-[10px] text-muted-foreground">{formatLastScraped(b.last_scraped_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isChecking}
                          onClick={() => handleCheckBrewery(b.id)}
                        >
                          {isChecking ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          Check
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isScraping}
                          onClick={() => handleScrapeBrewery(b.id, b.name)}
                        >
                          {isScraping ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Globe size={12} />
                          )}
                          Scrape
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {scrapingIds.size > 0 && (
              <div className="space-y-1">
                {[...scrapingIds].map(id => {
                  const b = breweries.find(br => br.id === id);
                  return (
                    <p key={id} className="text-xs text-muted-foreground animate-pulse flex items-center gap-1.5">
                      <Loader2 size={10} className="animate-spin" /> Scraping {b?.name || '...'}
                    </p>
                  );
                })}
              </div>
            )}
            {scrapeLog.length > 0 && (
              <div className="max-h-32 overflow-auto border rounded-lg divide-y divide-border text-xs">
                {[...scrapeLog].reverse().map((entry, i) => (
                  <div key={i} className={`px-3 py-1.5 flex items-center justify-between ${entry.error ? 'bg-destructive/5' : ''}`}>
                    <span className="font-medium truncate">{entry.name}</span>
                    {entry.error ? (
                      <span className="text-destructive text-[10px] truncate ml-2">{entry.error.substring(0, 40)}</span>
                    ) : (
                      <Badge variant="outline" className="text-[9px]">{entry.found} bieren</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check Results */}
          {checkResult && (
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" /> Check: {checkResult.brewery_name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{checkResult.beer_count} bieren</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setCheckResult(null)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{checkResult.summary}</p>

              {checkResult.duplicates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-warning">
                    <Copy size={14} /> {checkResult.duplicates.length} duplicaat-groep(en)
                  </h4>
                  <div className="space-y-2">
                    {checkResult.duplicates.map((dup, i) => (
                      <div key={i} className="bg-warning/5 border border-warning/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs space-y-1">
                            <p><span className="font-medium text-success">Behouden:</span> {dup.keep_name}</p>
                            <p><span className="font-medium text-destructive">Verwijderen:</span> {dup.remove_names.join(', ')}</p>
                            <p className="text-muted-foreground italic">{dup.reason}</p>
                          </div>
                          <Button size="sm" variant="destructive" className="shrink-0 gap-1.5" onClick={() => handleDeleteDuplicates(dup.remove_ids)}>
                            <Trash2 size={12} /> Verwijder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checkResult.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={14} /> {checkResult.issues.length} issue(s)
                  </h4>
                  <div className="max-h-48 overflow-auto border rounded-lg divide-y divide-border text-xs">
                    {checkResult.issues.map((issue, i) => (
                      <div key={i} className="px-3 py-2 flex items-start gap-2">
                        <Badge variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'secondary' : 'outline'} className="text-[9px] shrink-0 mt-0.5">
                          {issue.severity}
                        </Badge>
                        <div>
                          <span className="font-medium">{issue.beer_name}:</span>{' '}
                          <span className="text-muted-foreground">{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checkResult.duplicates.length === 0 && checkResult.issues.length === 0 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle size={16} /> Alles in orde — geen duplicaten of problemen gevonden.
                </div>
              )}
            </div>
          )}

          <div className="border-t border-border pt-6">
            <h3 className="font-serif text-base flex items-center gap-2 mb-3">
              <Upload size={16} className="text-accent" /> Of upload data handmatig
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Plak JSON of CSV data, of upload een bestand. Brouwerijnamen worden automatisch gematcht via fuzzy search.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                ref={fileRef}
                type="file"
                accept=".json,.csv,.tsv"
                onChange={handleFile}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload size={14} /> Upload JSON/CSV
              </Button>
            </div>

            <Textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder={`[{ "name": "Westmalle Tripel", "brewery": "Brouwerij Westmalle", "style": "Tripel", "abv": 9.5 }]`}
            />

            {loading && <Progress value={progress} className="h-2 mt-2" />}

            <Button onClick={handlePreview} disabled={loading || !jsonInput.trim()} className="gap-2 mt-3">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Beer size={14} />}
              Preview & Match
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview with fuzzy match confirmation */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-lg">Data Cleaning Preview</h3>
              <Badge variant="default">{linkedCount} gekoppeld</Badge>
              {unlinkedCount > 0 && (
                <Badge variant="destructive">{unlinkedCount} zonder brouwerij</Badge>
              )}
              {excludedCount > 0 && (
                <Badge variant="secondary">{excludedCount} uitgesloten</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStep('input'); setPreview([]); }}>
              ← Terug
            </Button>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Controleer de brouwerijkoppelingen hieronder. Je kunt de suggestie wijzigen of bieren uitsluiten.
              Bieren zonder brouwerijkoppeling worden overgeslagen.
            </p>
          </div>

          {/* Preview table */}
          <div className="max-h-[500px] overflow-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Bier</th>
                  <th className="px-3 py-2 text-left">Stijl</th>
                  <th className="px-3 py-2 text-left w-16">ABV</th>
                   <th className="px-3 py-2 text-left">Bron</th>
                   <th className="px-3 py-2 text-left min-w-[200px]">Gekoppeld aan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((beer, i) => (
                  <tr key={i} className={beer._excluded ? 'opacity-30 bg-muted/30' : ''}>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleExclude(i)}
                        className="text-muted-foreground hover:text-destructive"
                        title={beer._excluded ? 'Opnieuw includeren' : 'Uitsluiten'}
                      >
                        <X size={14} />
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">{beer.name}</td>
                    <td className="px-3 py-2">{beer.style || '—'}</td>
                    <td className="px-3 py-2">{beer.abv ? `${beer.abv}%` : '—'}</td>
                    <td className="px-3 py-2">
                       <Badge variant="outline" className="text-[9px]">{(beer as any)._source || beer.brewery_input || '—'}</Badge>
                     </td>
                    <td className="px-3 py-2">
                      {beer.brewery_matches.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={beer.brewery_id || ''}
                            onValueChange={(v) => setBreweryId(i, v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Selecteer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {beer.brewery_matches.map(m => (
                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                  <span className="flex items-center gap-2">
                                    {m.name}
                                    <Badge variant="outline" className="text-[9px] px-1">
                                      {m.similarity}%
                                    </Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {beer.brewery_id && (
                            <Link2 size={12} className="text-success shrink-0" />
                          )}
                        </div>
                      ) : (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle size={12} /> Geen match
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && <Progress value={progress} className="h-2" />}

          <div className="flex gap-3">
            <Button onClick={handleCommit} disabled={loading || linkedCount === 0} className="gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {linkedCount} bieren importeren
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/30 rounded-lg p-5 space-y-2">
            <h3 className="font-semibold text-success flex items-center gap-2">
              <CheckCircle size={16} /> Import voltooid
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="text-center">
                <p className="font-display text-2xl text-success">{result.inserted}</p>
                <p className="text-xs text-muted-foreground">Toegevoegd</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Overgeslagen</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStep('input');
              setPreview([]);
              setResult(null);
              setJsonInput('');
            }}
          >
            Nieuwe import
          </Button>
        </div>
      )}
    </div>
  );
}
