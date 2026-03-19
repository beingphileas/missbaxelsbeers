import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SyncResult {
  updated: number;
  inserted: number;
  errors: number;
  hhe_total: number;
}

export default function BulkStoryGenerator() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<SyncResult | null>(null);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setProgress(0);
    setTotal(0);

    try {
      let totalUpdated = 0;
      let totalInserted = 0;
      let totalErrors = 0;
      let hheTotal = 0;
      let offset = 0;
      const batchSize = 200;
      let keepGoing = true;

      while (keepGoing) {
        const { data, error } = await supabase.functions.invoke('sync-hhe-stories', {
          body: { batch_size: batchSize, offset },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        hheTotal = data.hhe_total ?? 0;
        totalUpdated += data.updated ?? 0;
        totalInserted += data.inserted ?? 0;
        totalErrors += data.errors ?? 0;

        if (total === 0 && hheTotal > 0) setTotal(hheTotal);
        setProgress(offset + (data.updated ?? 0) + (data.inserted ?? 0));

        if (!data.has_more) {
          keepGoing = false;
        }
        offset = data.next_offset ?? offset + batchSize;
      }

      const res = { updated: totalUpdated, inserted: totalInserted, errors: totalErrors, hhe_total: hheTotal };
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
      toast.success(`Sync klaar: ${totalUpdated} bijgewerkt, ${totalInserted} nieuw toegevoegd`);
    } catch (e: any) {
      toast.error(e.message || 'Synchronisatie mislukt');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Database size={18} /> Database Synchronisatie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Synchroniseer de volledige brouwerijdatabase vanuit Hop Heritage Explorer.
          Alle velden worden overschreven met de HHE-data. Nieuwe brouwerijen worden automatisch toegevoegd.
        </p>

        <Button onClick={handleSync} disabled={syncing} className="gap-1.5">
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {syncing ? 'Synchroniseren…' : 'Volledige sync starten'}
        </Button>

        {syncing && total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bezig met synchroniseren...</span>
              <span>{progress} / {total}</span>
            </div>
            <Progress value={total > 0 ? (progress / total) * 100 : 0} />
          </div>
        )}

        {result && (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle size={14} />
              <span>{result.updated} brouwerijen bijgewerkt</span>
            </div>
            {result.inserted > 0 && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle size={14} />
                <span>{result.inserted} nieuwe brouwerijen toegevoegd</span>
              </div>
            )}
            {result.errors > 0 && (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle size={14} />
                <span>{result.errors} fouten</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              HHE bevat {result.hhe_total} brouwerijen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
