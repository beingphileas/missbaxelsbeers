import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
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
  Search,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import BreweryScreenCapture from './BreweryScreenCapture';
import BreweryBeerManager from './BreweryBeerManager';

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
  _validation?: { exists: boolean; reason: string } | null;
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
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [preview, setPreview] = useState<BeerPreview[]>([]);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [breweries, setBreweries] = useState<BreweryItem[]>([]);
  const [brewerySearch, setBrewerySearch] = useState('');

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

  const filteredBreweries = useMemo(() => {
    const sorted = [...breweries].sort((a, b) => a.name.localeCompare(b.name));
    if (brewerySearch.length >= 1) {
      return sorted.filter(b => b.name.toLowerCase().includes(brewerySearch.toLowerCase()));
    }
    return sorted;
  }, [breweries, brewerySearch]);

  const parseInput = useCallback((raw: string): any[] => {
    const trimmed = raw.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
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
    setPreview(prev => prev.map((b, i) => (i === index ? { ...b, _excluded: !b._excluded } : b)));
  };

  const setBreweryId = (index: number, breweryId: string) => {
    setPreview(prev => prev.map((b, i) => (i === index ? { ...b, brewery_id: breweryId } : b)));
  };

  const handleCommit = async () => {
    const toInsert = preview
      .filter(b => !b._excluded && b.brewery_id)
      .map(b => ({
        name: b.name, brewery_id: b.brewery_id, style: b.style,
        abv: b.abv, description: b.description, source_url: b.source_url, image_url: b.image_url,
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

  const handleValidate = async () => {
    const toValidate = preview.filter(b => !b._excluded).map(b => ({
      name: b.name,
      brewery_name: b.brewery_matches[0]?.name || b.brewery_input,
    }));
    if (toValidate.length === 0) return;
    setValidating(true);
    try {
      const res = await supabase.functions.invoke('import-beers', {
        body: { beers: toValidate, mode: 'validate' },
      });
      if (res.error) throw res.error;
      const validations = res.data?.validations ?? [];
      setPreview(prev => prev.map(beer => {
        const match = validations.find((v: any) =>
          v.name?.toLowerCase().trim() === beer.name.toLowerCase().trim()
        );
        if (match && !match.exists) {
          return { ...beer, _validation: match, _excluded: true };
        }
        return { ...beer, _validation: match ?? null };
      }));
      const suspects = validations.filter((v: any) => !v.exists);
      if (suspects.length > 0) {
        toast({ title: `${suspects.length} verdachte bieren gevonden`, description: 'Deze zijn automatisch uitgesloten.', variant: 'destructive' });
      } else {
        toast({ title: 'Alle bieren gevalideerd ✓' });
      }
    } catch (err: any) {
      toast({ title: 'Validatie mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setValidating(false);
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
          {/* Brewery list with capture + manage */}
          <div className="space-y-3">
            <h3 className="font-serif text-base flex items-center gap-2">
              <Beer size={16} className="text-accent" /> Bieren per brouwerij
            </h3>
            <p className="text-xs text-muted-foreground">
              Zoek een brouwerij en upload een opgeslagen Untappd HTML-pagina of beheer bestaande bieren.
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
              <BreweryVirtualList
                breweries={filteredBreweries}
                setBreweries={setBreweries}
                setPreview={setPreview}
                setStep={setStep}
              />
            )}
          </div>

          {/* Manual upload */}
          <div className="border-t border-border pt-6">
            <h3 className="font-serif text-base flex items-center gap-2 mb-3">
              <Upload size={16} className="text-accent" /> Of upload data handmatig
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Plak JSON of CSV data, of upload een bestand. Brouwerijnamen worden automatisch gematcht via fuzzy search.
            </p>
            <div className="flex gap-2 mb-3">
              <input ref={fileRef} type="file" accept=".json,.csv,.tsv" onChange={handleFile} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload size={14} /> Upload JSON/CSV
              </Button>
            </div>
            <Textarea
              value={jsonInput} onChange={e => setJsonInput(e.target.value)}
              rows={8} className="font-mono text-xs"
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

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-lg">Data Cleaning Preview</h3>
              <Badge variant="default">{linkedCount} gekoppeld</Badge>
              {unlinkedCount > 0 && <Badge variant="destructive">{unlinkedCount} zonder brouwerij</Badge>}
              {excludedCount > 0 && <Badge variant="secondary">{excludedCount} uitgesloten</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStep('input'); setPreview([]); }}>← Terug</Button>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Controleer de brouwerijkoppelingen hieronder. Je kunt de suggestie wijzigen of bieren uitsluiten.
            </p>
          </div>

          <div className="max-h-[500px] overflow-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Bier</th>
                  <th className="px-3 py-2 text-left">Stijl</th>
                  <th className="px-3 py-2 text-left w-16">ABV</th>
                  <th className="px-3 py-2 text-left min-w-[200px]">Gekoppeld aan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((beer, i) => (
                  <tr key={i} className={beer._excluded ? 'opacity-30 bg-muted/30' : ''}>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleExclude(i)} className="text-muted-foreground hover:text-destructive"
                        title={beer._excluded ? 'Opnieuw includeren' : 'Uitsluiten'}>
                        <X size={14} />
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        {beer.name}
                        {beer._validation?.exists === false && (
                          <Badge variant="destructive" className="text-[9px] px-1">⚠ suspect</Badge>
                        )}
                        {beer._validation?.exists === true && (
                          <CheckCircle size={10} className="text-success" />
                        )}
                      </div>
                      {beer._validation?.reason && !beer._validation.exists && (
                        <p className="text-[10px] text-destructive mt-0.5">{beer._validation.reason}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">{beer.style || '—'}</td>
                    <td className="px-3 py-2">{beer.abv ? `${beer.abv}%` : '—'}</td>
                    <td className="px-3 py-2">
                      {beer.brewery_matches.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Select value={beer.brewery_id || ''} onValueChange={(v) => setBreweryId(i, v)}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                            <SelectContent>
                              {beer.brewery_matches.map(m => (
                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                  <span className="flex items-center gap-2">
                                    {m.name}
                                    <Badge variant="outline" className="text-[9px] px-1">{m.similarity}%</Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {beer.brewery_id && <Link2 size={12} className="text-success shrink-0" />}
                        </div>
                      ) : (
                        <span className="text-destructive flex items-center gap-1"><AlertTriangle size={12} /> Geen match</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && <Progress value={progress} className="h-2" />}
          <div className="flex gap-3">
            <Button onClick={handleValidate} disabled={validating || loading} variant="outline" className="gap-2">
              {validating ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              Valideer bieren (AI)
            </Button>
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
          <Button variant="outline" onClick={() => { setStep('input'); setResult(null); setJsonInput(''); setPreview([]); }}>
            Nieuwe import
          </Button>
        </div>
      )}
    </div>
  );
}
