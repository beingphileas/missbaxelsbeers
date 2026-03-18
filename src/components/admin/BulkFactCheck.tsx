import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ShieldCheck, Play, Square, CheckCircle2, AlertCircle } from 'lucide-react';

interface BeerRow {
  id: string;
  name: string;
  style: string;
  quality_score: number | null;
  factcheck_json: any;
  analysis_json: any;
  brewery_name: string;
}

type FilterMode = 'missing' | 'all' | 'rescore';

export default function BulkFactCheck() {
  const [beers, setBeers] = useState<BeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('missing');
  const [running, setRunning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentBeer, setCurrentBeer] = useState('');
  const [errors, setErrors] = useState(0);
  const [results, setResults] = useState<{ name: string; score: number | null; ok: boolean }[]>([]);

  const fetchBeers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('beers')
      .select('id, name, style, quality_score, factcheck_json, breweries:brewery_id(name)')
      .order('name');

    if (!error && data) {
      setBeers(data.map((b: any) => ({
        id: b.id,
        name: b.name,
        style: b.style,
        quality_score: b.quality_score,
        factcheck_json: b.factcheck_json,
        brewery_name: b.breweries?.name ?? 'Onbekend',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchBeers(); }, []);

  const getTargets = () => {
    if (filterMode === 'missing') return beers.filter(b => !b.factcheck_json);
    return beers; // 'all' and 'rescore' both process everything
  };

  const targets = getTargets();

  const run = async () => {
    if (targets.length === 0) {
      toast({ title: 'Geen bieren om te verwerken' });
      return;
    }

    setRunning(true);
    setCancelled(false);
    setProgress(0);
    setTotal(targets.length);
    setErrors(0);
    setResults([]);

    let done = 0;
    let errCount = 0;
    const newResults: typeof results = [];

    for (const beer of targets) {
      if (cancelled) break;

      setCurrentBeer(`${beer.name} (${beer.brewery_name})`);

      try {
        // Step 1: AI Analysis
        setCurrentBeer(`${beer.name} (${beer.brewery_name}) — analyse...`);
        const { error: analyzeErr } = await supabase.functions.invoke('analyze-beer', {
          body: { beer_id: beer.id },
        });
        if (analyzeErr) throw analyzeErr;

        // Step 2: Factcheck
        setCurrentBeer(`${beer.name} (${beer.brewery_name}) — factcheck...`);
        const { error: factErr } = await supabase.functions.invoke('factcheck-beer', {
          body: { beer_id: beer.id },
        });
        if (factErr) throw factErr;

        // Fetch updated score
        const { data: updated } = await supabase
          .from('beers')
          .select('quality_score')
          .eq('id', beer.id)
          .single();

        newResults.push({ name: beer.name, score: updated?.quality_score ?? null, ok: true });
      } catch (err: any) {
        console.error(`Factcheck failed for ${beer.name}:`, err);
        errCount++;
        newResults.push({ name: beer.name, score: null, ok: false });
      }

      done++;
      setProgress(done);
      setErrors(errCount);
      setResults([...newResults]);

      // Rate limit protection
      if (done < targets.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setRunning(false);
    setCurrentBeer('');
    fetchBeers();

    toast({
      title: 'Bulk factcheck voltooid',
      description: `${done - errCount}/${targets.length} succesvol${errCount > 0 ? `, ${errCount} fouten` : ''}`,
    });
  };

  const missingCount = beers.filter(b => !b.factcheck_json).length;
  const checkedCount = beers.filter(b => b.factcheck_json).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{beers.length} bieren totaal</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-success" /> {checkedCount} factchecked
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle size={12} className="text-warning" /> {missingCount} ontbreken
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Modus</label>
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)} disabled={running}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="missing">Alleen ontbrekende ({missingCount})</SelectItem>
              <SelectItem value="all">Alles herberekenen ({beers.length})</SelectItem>
              <SelectItem value="rescore">Scores herberekenen ({beers.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!running ? (
          <Button onClick={run} disabled={loading || targets.length === 0} className="gap-2">
            <Play size={14} />
            Start factcheck ({targets.length} bieren)
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => setCancelled(true)} className="gap-2">
            <Square size={14} />
            Stop
          </Button>
        )}
      </div>

      {/* Progress */}
      {running && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span className="truncate flex-1">{currentBeer}</span>
            <span className="text-muted-foreground shrink-0">{progress}/{total}</span>
            {errors > 0 && (
              <Badge variant="destructive" className="text-[10px]">{errors} fouten</Badge>
            )}
          </div>
          <Progress value={total ? (progress / total) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Results log */}
      {results.length > 0 && (
        <div className="border rounded-lg max-h-[400px] overflow-auto divide-y divide-border">
          {results.map((r, i) => (
            <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {r.ok ? (
                  <ShieldCheck size={12} className="text-success shrink-0" />
                ) : (
                  <AlertCircle size={12} className="text-destructive shrink-0" />
                )}
                <span className="truncate">{r.name}</span>
              </div>
              {r.score != null && (
                <span className={`font-bold tabular-nums shrink-0 ${
                  r.score >= 80 ? 'text-success' : r.score >= 60 ? 'text-warning' : 'text-destructive'
                }`}>
                  {r.score}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
