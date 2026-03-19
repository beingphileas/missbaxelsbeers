import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BookOpen, Play, Square, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface LogEntry {
  name: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

export default function BulkStoryGenerator() {
  const [running, setRunning] = useState(false);
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const abortRef = useRef(false);
  const queryClient = useQueryClient();

  const addLog = useCallback((entry: LogEntry) => {
    setLog(prev => [entry, ...prev]);
  }, []);

  const run = async () => {
    abortRef.current = false;
    setRunning(true);
    setLog([]);
    setProgress(0);

    // Fetch all breweries
    const pageSize = 1000;
    let from = 0;
    const allBreweries: any[] = [];
    while (true) {
      const { data, error } = await supabase
        .from('breweries')
        .select('id, name, story')
        .order('name')
        .range(from, from + pageSize - 1);
      if (error || !data?.length) break;
      allBreweries.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const targets = onlyEmpty
      ? allBreweries.filter(b => !b.story || b.story.trim() === '')
      : allBreweries;

    setTotal(targets.length);

    if (targets.length === 0) {
      addLog({ name: '-', status: 'skipped', message: 'Geen brouwerijen om te verwerken' });
      setRunning(false);
      return;
    }

    let done = 0;

    for (const brewery of targets) {
      if (abortRef.current) {
        addLog({ name: brewery.name, status: 'skipped', message: 'Gestopt door gebruiker' });
        break;
      }

      setCurrent(brewery.name);

      try {
        const { data, error } = await supabase.functions.invoke('generate-brewery-story', {
          body: { breweryId: brewery.id },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        addLog({ name: brewery.name, status: 'success' });
      } catch (e: any) {
        const msg = e?.message || 'Onbekende fout';

        // Stop on rate limit or credits
        if (msg.includes('429') || msg.includes('Rate limit') || msg.includes('402')) {
          addLog({ name: brewery.name, status: 'error', message: msg });
          addLog({ name: '-', status: 'error', message: 'Gestopt vanwege rate limit / credits' });
          break;
        }

        addLog({ name: brewery.name, status: 'error', message: msg });
      }

      done++;
      setProgress(done);

      // Delay to avoid rate limits (1.5s between requests)
      if (!abortRef.current && done < targets.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setCurrent('');
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['breweries'] });
  };

  const stop = () => {
    abortRef.current = true;
  };

  const successCount = log.filter(l => l.status === 'success').length;
  const errorCount = log.filter(l => l.status === 'error').length;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <BookOpen size={18} /> Bulk Verhaal Generatie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch id="only-empty" checked={onlyEmpty} onCheckedChange={setOnlyEmpty} disabled={running} />
            <Label htmlFor="only-empty" className="text-sm">
              Alleen brouwerijen zonder verhaal
            </Label>
          </div>

          <div className="flex gap-2">
            {!running ? (
              <Button onClick={run} className="gap-1.5">
                <Play size={14} /> Start generatie
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive" className="gap-1.5">
                <Square size={14} /> Stop
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{current ? `Bezig met: ${current}` : 'Klaar'}</span>
              <span>{progress} / {total}</span>
            </div>
            <Progress value={total > 0 ? (progress / total) * 100 : 0} />
            <div className="flex gap-3 text-xs">
              <span className="text-success flex items-center gap-1"><CheckCircle size={10} /> {successCount} succesvol</span>
              <span className="text-destructive flex items-center gap-1"><XCircle size={10} /> {errorCount} fouten</span>
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border/50">
            {log.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                {entry.status === 'success' && <CheckCircle size={12} className="text-success shrink-0" />}
                {entry.status === 'error' && <XCircle size={12} className="text-destructive shrink-0" />}
                {entry.status === 'skipped' && <AlertTriangle size={12} className="text-muted-foreground shrink-0" />}
                <span className="font-medium truncate">{entry.name}</span>
                {entry.message && <span className="text-muted-foreground ml-auto shrink-0">{entry.message}</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
