import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BulkStoryGenerator() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ matched: number; total: number } | null>(null);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      let totalMatched = 0;
      let batch = 0;
      const batchSize = 100;
      let keepGoing = true;

      while (keepGoing) {
        const { data, error } = await supabase.functions.invoke('sync-hhe-stories', {
          body: { batch_size: batchSize, offset: batch * batchSize },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        totalMatched += data?.matched ?? 0;

        if (!data?.matched || data.matched < batchSize) {
          keepGoing = false;
        }
        batch++;
      }

      setResult({ matched: totalMatched, total: batch * batchSize });
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
      toast.success(`${totalMatched} verhalen bijgewerkt vanuit Hop Heritage Explorer`);
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
          <BookOpen size={18} /> Verhalen Synchronisatie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Haal ontbrekende brouwerijverhalen op uit Hop Heritage Explorer en vul ze automatisch aan.
        </p>

        <Button onClick={handleSync} disabled={syncing} className="gap-1.5">
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {syncing ? 'Synchroniseren…' : 'Update verhalen uit HHE'}
        </Button>

        {result && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle size={14} />
            <span>{result.matched} verhalen bijgewerkt</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
