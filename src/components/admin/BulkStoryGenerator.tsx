import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, Loader2, CheckCircle, XCircle, Eye, Send, ChevronDown, ChevronRight, CalendarCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FieldDiff {
  old: any;
  new: any;
}

interface ChangeItem {
  action: 'update' | 'insert';
  local_id?: string;
  name: string;
  diffs?: Record<string, FieldDiff>;
  fields?: Record<string, any>;
  // UI state
  _approved: boolean;
  _approved_fields: Set<string>;
  _expanded: boolean;
}

interface CommitResult {
  updated: number;
  inserted: number;
  errors: number;
}

export default function BulkStoryGenerator() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'preview' | 'done'>('idle');
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [stats, setStats] = useState({ hhe_total: 0, local_total: 0 });
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [markingUpToDate, setMarkingUpToDate] = useState(false);
  const queryClient = useQueryClient();

  const handlePreview = async () => {
    setLoading(true);
    setStep('idle');
    setChanges([]);
    try {
      const { data, error } = await supabase.functions.invoke('sync-hhe-stories', {
        body: { mode: 'preview' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStats({ hhe_total: data.hhe_total, local_total: data.local_total });

      const items: ChangeItem[] = (data.changes ?? []).map((c: any) => ({
        ...c,
        _approved: true,
        _approved_fields: new Set(
          c.action === 'update' ? Object.keys(c.diffs ?? {}) : []
        ),
        _expanded: false,
      }));

      setChanges(items);
      setStep('preview');
    } catch (e: any) {
      toast.error(e.message || 'Preview mislukt');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproved = (i: number) => {
    setChanges(prev => prev.map((c, idx) => idx === i ? { ...c, _approved: !c._approved } : c));
  };

  const toggleField = (i: number, field: string) => {
    setChanges(prev => prev.map((c, idx) => {
      if (idx !== i) return c;
      const newSet = new Set(c._approved_fields);
      if (newSet.has(field)) newSet.delete(field); else newSet.add(field);
      return { ...c, _approved_fields: newSet };
    }));
  };

  const toggleExpanded = (i: number) => {
    setChanges(prev => prev.map((c, idx) => idx === i ? { ...c, _expanded: !c._expanded } : c));
  };

  const approvedCount = changes.filter(c => c._approved).length;
  const updateCount = changes.filter(c => c.action === 'update').length;
  const insertCount = changes.filter(c => c.action === 'insert').length;

  const handleCommit = async () => {
    setLoading(true);
    try {
      const approved = changes
        .filter(c => c._approved)
        .map(c => {
          if (c.action === 'update') {
            return {
              action: 'update',
              local_id: c.local_id,
              approved_fields: Array.from(c._approved_fields),
              diffs: c.diffs,
            };
          }
          return { action: 'insert', fields: c.fields };
        });

      const { data, error } = await supabase.functions.invoke('sync-hhe-stories', {
        body: { mode: 'commit', approved },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCommitResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
      toast.success(`Sync klaar: ${data.updated} bijgewerkt, ${data.inserted} nieuw`);
    } catch (e: any) {
      toast.error(e.message || 'Commit mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUpToDate = async () => {
    setMarkingUpToDate(true);
    try {
      // Get all brewery IDs that have at least one beer
      let allBeerBreweryIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data } = await supabase
          .from('beers')
          .select('brewery_id')
          .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allBeerBreweryIds.push(...data.map(d => d.brewery_id));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      const uniqueIds = [...new Set(allBeerBreweryIds)];

      if (uniqueIds.length === 0) {
        toast.info('Geen brouwerijen met bieren gevonden');
        return;
      }

      // Update in batches of 50
      let updated = 0;
      const now = new Date().toISOString();
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const batch = uniqueIds.slice(i, i + 50);
        const { error } = await supabase
          .from('breweries')
          .update({ last_scraped_at: now })
          .in('id', batch);
        if (!error) updated += batch.length;
      }

      toast.success(`${updated} brouwerijen gemarkeerd als up-to-date`);
      queryClient.invalidateQueries({ queryKey: ['breweries'] });
    } catch (e: any) {
      toast.error(e.message || 'Fout bij markeren');
    } finally {
      setMarkingUpToDate(false);
    }
  };

  const formatValue = (v: any): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Ja' : 'Nee';
    const s = String(v);
    return s.length > 60 ? s.slice(0, 57) + '…' : s;
  };

  return (
    <div className="space-y-6">
      {/* Bulk mark up-to-date */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <CalendarCheck size={18} /> Bier-importstatus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Markeer alle brouwerijen die al bieren in de database hebben als "up-to-date" met de datum van vandaag.
          </p>
          <Button onClick={handleMarkUpToDate} disabled={markingUpToDate} variant="outline" className="gap-1.5">
            {markingUpToDate ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
            Brouwerijen met bieren markeren als up-to-date
          </Button>
        </CardContent>
      </Card>

      {/* HHE Sync */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Database size={18} /> Database Synchronisatie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'idle' && (
            <>
              <p className="text-sm text-muted-foreground">
                Haal wijzigingen op uit Hop Heritage Explorer. Je krijgt een preview met checkboxes om te kiezen wat je overneemt.
              </p>
              <Button onClick={handlePreview} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                {loading ? 'Ophalen…' : 'Preview ophalen'}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.hhe_total} in HHE</Badge>
                  <Badge variant="outline">{stats.local_total} lokaal</Badge>
                  <Badge>{updateCount} wijzigingen</Badge>
                  {insertCount > 0 && <Badge variant="secondary">{insertCount} nieuw</Badge>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStep('idle'); setChanges([]); }}>
                  ← Terug
                </Button>
              </div>

              {changes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen verschillen gevonden — databases zijn identiek.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setChanges(prev => prev.map(c => ({ ...c, _approved: true })))}
                    >Alles selecteren</Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setChanges(prev => prev.map(c => ({ ...c, _approved: false })))}
                    >Niets selecteren</Button>
                  </div>

                  <div className="max-h-[500px] overflow-auto border rounded-lg divide-y divide-border">
                    {changes.map((change, i) => (
                      <div key={i} className={`${change._approved ? '' : 'opacity-40'}`}>
                        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50">
                          <Checkbox
                            checked={change._approved}
                            onCheckedChange={() => toggleApproved(i)}
                          />
                          <button
                            onClick={() => toggleExpanded(i)}
                            className="flex items-center gap-1 text-muted-foreground"
                          >
                            {change._expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <span className="text-sm font-medium flex-1 min-w-0 truncate">{change.name}</span>
                          <Badge variant={change.action === 'insert' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                            {change.action === 'insert' ? 'Nieuw' : `${Object.keys(change.diffs ?? {}).length} velden`}
                          </Badge>
                        </div>

                        {change._expanded && change.action === 'update' && change.diffs && (
                          <div className="px-10 pb-3 space-y-1">
                            {Object.entries(change.diffs).map(([field, diff]) => (
                              <div key={field} className="flex items-start gap-2 text-xs">
                                <Checkbox
                                  checked={change._approved_fields.has(field)}
                                  onCheckedChange={() => toggleField(i, field)}
                                  className="mt-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="font-mono text-muted-foreground">{field}</span>
                                  <div className="flex gap-2 mt-0.5">
                                    <span className="text-destructive line-through">{formatValue(diff.old)}</span>
                                    <span>→</span>
                                    <span className="text-success">{formatValue(diff.new)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {change._expanded && change.action === 'insert' && change.fields && (
                          <div className="px-10 pb-3 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                            {Object.entries(change.fields).map(([field, val]) => (
                              <div key={field}>
                                <span className="font-mono text-muted-foreground">{field}:</span>{' '}
                                <span>{formatValue(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {loading && <Progress value={50} className="h-2" />}
                  <Button onClick={handleCommit} disabled={loading || approvedCount === 0} className="gap-1.5">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {approvedCount} wijzigingen doorvoeren
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'done' && commitResult && (
            <div className="space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle size={14} /> {commitResult.updated} bijgewerkt
                </div>
                {commitResult.inserted > 0 && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle size={14} /> {commitResult.inserted} nieuw toegevoegd
                  </div>
                )}
                {commitResult.errors > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle size={14} /> {commitResult.errors} fouten
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={() => { setStep('idle'); setCommitResult(null); setChanges([]); }}>
                Nieuwe sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
