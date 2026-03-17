import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react';

interface FactCheckIssue {
  field: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

interface FactCheckResult {
  entity_type: string;
  entity_id: string;
  entity_label: string;
  score: number;
  verdict: 'correct' | 'deels_correct' | 'verdacht' | 'fout';
  issues: FactCheckIssue[];
  summary: string;
}

interface Entity {
  id: string;
  name: string;
  extra?: string;
}

const verdictConfig = {
  correct: { label: 'Correct', color: 'bg-success text-success-foreground' },
  deels_correct: { label: 'Deels correct', color: 'bg-warning text-warning-foreground' },
  verdacht: { label: 'Verdacht', color: 'bg-orange-500 text-white' },
  fout: { label: 'Fout', color: 'bg-destructive text-destructive-foreground' },
};

const severityIcon = {
  info: <Info size={12} className="text-blue-500" />,
  warning: <AlertTriangle size={12} className="text-warning" />,
  error: <XCircle size={12} className="text-destructive" />,
};

export default function FactChecker() {
  const [entityType, setEntityType] = useState<'brewery' | 'beer' | 'venue'>('brewery');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [search, setSearch] = useState('');
  const [checking, setChecking] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, FactCheckResult>>(new Map());
  const [bulkChecking, setBulkChecking] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Load entities when type changes
  useEffect(() => {
    const load = async () => {
      if (entityType === 'brewery') {
        const { data } = await supabase.from('breweries').select('id, name, type, province').order('name');
        setEntities((data ?? []).map(b => ({ id: b.id, name: b.name, extra: `${b.type} · ${b.province}` })));
      } else if (entityType === 'beer') {
        const { data } = await supabase.from('beers').select('id, name, style, breweries:brewery_id(name)').order('name');
        setEntities((data ?? []).map(b => ({ id: b.id, name: b.name, extra: `${(b as any).breweries?.name ?? ''} · ${b.style}` })));
      } else if (entityType === 'venue') {
        const { data } = await supabase.from('venues').select('id, name, venue_type, province').order('name');
        setEntities((data ?? []).map(v => ({ id: v.id, name: v.name, extra: `${v.venue_type} · ${v.province}` })));
      }
    };
    load();
    setResults(new Map());
    setSearch('');
  }, [entityType]);

  const filtered = search.length >= 2
    ? entities.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : entities.slice(0, 50);

  const runFactCheck = async (entityId: string) => {
    setChecking(entityId);
    try {
      const res = await supabase.functions.invoke('fact-check', {
        body: { entity_type: entityType, entity_id: entityId },
      });

      if (res.error) {
        toast({ title: 'Fact-check fout', description: res.error.message, variant: 'destructive' });
        return;
      }

      setResults(prev => new Map(prev).set(entityId, res.data));
      const data = res.data as FactCheckResult;
      const errors = data.issues.filter(i => i.severity === 'error').length;
      const warnings = data.issues.filter(i => i.severity === 'warning').length;
      toast({
        title: `Score: ${data.score}/100 — ${verdictConfig[data.verdict]?.label}`,
        description: `${errors} fouten, ${warnings} waarschuwingen`,
      });
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setChecking(null);
    }
  };

  const runBulkCheck = async () => {
    setBulkChecking(true);
    setBulkProgress(0);
    const toCheck = filtered.slice(0, 20); // max 20 at a time

    for (let i = 0; i < toCheck.length; i++) {
      const entity = toCheck[i];
      try {
        const res = await supabase.functions.invoke('fact-check', {
          body: { entity_type: entityType, entity_id: entity.id },
        });
        if (!res.error && res.data) {
          setResults(prev => new Map(prev).set(entity.id, res.data));
        }
      } catch {
        // continue
      }
      setBulkProgress(Math.round(((i + 1) / toCheck.length) * 100));
      // Rate limit protection
      if (i < toCheck.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setBulkChecking(false);
    toast({ title: 'Bulk fact-check klaar', description: `${toCheck.length} items gecheckt` });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brewery">Brouwerijen</SelectItem>
              <SelectItem value="beer">Bieren</SelectItem>
              <SelectItem value="venue">Venues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Zoeken</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam..."
              className="pl-9"
            />
          </div>
        </div>

        <Button
          onClick={runBulkCheck}
          disabled={bulkChecking || filtered.length === 0}
          variant="outline"
          className="gap-2"
        >
          {bulkChecking ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Check alle ({Math.min(filtered.length, 20)})
        </Button>
      </div>

      {bulkChecking && <Progress value={bulkProgress} className="h-2" />}

      {/* Results list */}
      <div className="border rounded-lg max-h-[600px] overflow-auto divide-y divide-border">
        {filtered.map(entity => {
          const result = results.get(entity.id);
          const isChecking = checking === entity.id;

          return (
            <div key={entity.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{entity.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{entity.extra}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {result && (
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${scoreColor(result.score)}`}>
                        {result.score}
                      </span>
                      <Badge className={`text-[10px] ${verdictConfig[result.verdict]?.color || ''}`}>
                        {verdictConfig[result.verdict]?.label || result.verdict}
                      </Badge>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={isChecking || bulkChecking}
                    onClick={() => runFactCheck(entity.id)}
                  >
                    {isChecking ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={12} />
                    )}
                    Check
                  </Button>
                </div>
              </div>

              {/* Expanded result */}
              {result && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground italic">{result.summary}</p>

                  {result.issues.length > 0 && (
                    <div className="space-y-1">
                      {result.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 text-xs rounded-md px-2.5 py-1.5 ${
                            issue.severity === 'error'
                              ? 'bg-destructive/10'
                              : issue.severity === 'warning'
                              ? 'bg-warning/10'
                              : 'bg-muted'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">{severityIcon[issue.severity]}</span>
                          <div className="min-w-0">
                            <span className="font-medium">{issue.field}:</span>{' '}
                            <span>{issue.message}</span>
                            {issue.suggestion && (
                              <p className="text-muted-foreground mt-0.5">💡 {issue.suggestion}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.issues.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-success bg-success/10 rounded-md px-2.5 py-1.5">
                      <CheckCircle size={12} />
                      Geen problemen gevonden
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Geen items gevonden</p>
        )}
      </div>
    </div>
  );
}
