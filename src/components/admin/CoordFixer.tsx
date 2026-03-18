import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { MapPin, AlertTriangle, RefreshCw, Save, Loader2, Globe } from 'lucide-react';

interface BreweryCoord {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  province: string;
  duplicateCount?: number;
}

export default function CoordFixer() {
  const [issues, setIssues] = useState<BreweryCoord[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeocoding, setRegeocoding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');

  const loadIssues = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('breweries')
      .select('id, name, address, lat, lng, province')
      .order('name');

    if (!data) { setLoading(false); return; }

    // Find duplicate coords
    const coordMap = new Map<string, BreweryCoord[]>();
    for (const b of data) {
      const key = `${b.lat.toFixed(6)},${b.lng.toFixed(6)}`;
      if (!coordMap.has(key)) coordMap.set(key, []);
      coordMap.get(key)!.push(b as BreweryCoord);
    }

    const dupes: BreweryCoord[] = [];
    for (const [, group] of coordMap) {
      if (group.length > 1) {
        group.forEach(b => {
          b.duplicateCount = group.length;
          dupes.push(b);
        });
      }
    }

    // Also add breweries without address
    const noAddr = data.filter(b => !b.address || b.address.trim() === '');
    noAddr.forEach(b => {
      if (!dupes.find(d => d.id === b.id)) {
        dupes.push({ ...b, address: b.address ?? '', duplicateCount: 0 } as BreweryCoord);
      }
    });

    setIssues(dupes);
    setLoading(false);
  };

  useEffect(() => { loadIssues(); }, []);

  const handleSave = async (id: string) => {
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: 'Ongeldige coördinaten', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('breweries')
      .update({ lat, lng })
      .eq('id', id);

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Coördinaten bijgewerkt' });
      setEditingId(null);
      loadIssues();
    }
  };

  // Regeocode duplicates only
  const handleRegeocode = async () => {
    setRegeocoding(true);
    toast({ title: 'Hergeocoding gestart...', description: 'Dit kan enkele minuten duren (1 per seconde).' });

    try {
      const { data, error } = await supabase.functions.invoke('regeocode-breweries', {
        body: { mode: 'duplicates', batch_size: 40 },
      });

      if (error) throw error;
      toast({
        title: `Hergeocoding klaar`,
        description: `${data.fixed} gefixt, ${data.failed} gefaald van ${data.batch_processed} verwerkt`,
      });
      loadIssues();
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    }
    setRegeocoding(false);
  };

  // Regeocode ALL breweries in batches
  const [regeocodeAllRunning, setRegeocodeAllRunning] = useState(false);
  const [regeocodeProgress, setRegeocodeProgress] = useState({ done: 0, total: 0, fixed: 0, failed: 0 });

  const handleRegeocodeAll = async () => {
    setRegeocodeAllRunning(true);
    let offset = 0;
    const batchSize = 40;
    let totalFixed = 0;
    let totalFailed = 0;
    let totalEligible = 0;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('regeocode-breweries', {
          body: { mode: 'all', batch_size: batchSize, offset },
        });

        if (error) throw error;

        totalEligible = data.total_eligible;
        totalFixed += data.fixed;
        totalFailed += data.failed;
        const processed = offset + data.batch_processed;
        setRegeocodeProgress({ done: processed, total: totalEligible, fixed: totalFixed, failed: totalFailed });

        if (!data.has_more) break;
        offset = data.next_offset;
      }

      toast({
        title: 'Alle brouwerijen hergeocode!',
        description: `${totalFixed} gefixt, ${totalFailed} gefaald van ${totalEligible} totaal`,
      });
      loadIssues();
    } catch (err: any) {
      toast({ title: 'Fout bij regeocode', description: err.message, variant: 'destructive' });
    }
    setRegeocodeAllRunning(false);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <AlertTriangle size={18} className="text-accent" />
            Locatieproblemen
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {issues.length} brouwerijen met dubbele coördinaten of ontbrekend adres
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadIssues} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button
            size="sm"
            onClick={handleRegeocode}
            disabled={regeocoding || regeocodeAllRunning}
            className="gap-1.5"
          >
            {regeocoding ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            Duplicaten fixen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegeocodeAll}
            disabled={regeocoding || regeocodeAllRunning}
            className="gap-1.5"
          >
            {regeocodeAllRunning ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Alles hergeocoden
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {regeocodeAllRunning && regeocodeProgress.total > 0 && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin text-primary" />
              <span>{regeocodeProgress.done}/{regeocodeProgress.total} verwerkt</span>
              <span>· {regeocodeProgress.fixed} gefixt</span>
              {regeocodeProgress.failed > 0 && <span className="text-destructive">· {regeocodeProgress.failed} gefaald</span>}
            </div>
            <Progress value={regeocodeProgress.total ? (regeocodeProgress.done / regeocodeProgress.total) * 100 : 0} className="h-1.5" />
          </div>
        )}
        {loading ? (
          <p className="text-muted-foreground py-8 text-center">Laden...</p>
        ) : issues.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">Geen problemen gevonden! 🎉</p>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {issues.map(b => (
              <div key={b.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{b.name}</span>
                    {b.duplicateCount && b.duplicateCount > 1 && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {b.duplicateCount}× gestapeld
                      </Badge>
                    )}
                    {(!b.address || b.address.trim() === '') && (
                      <Badge variant="destructive" className="text-[10px] shrink-0">
                        Geen adres
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.address || 'Geen adres'} · {b.province}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {b.lat.toFixed(5)}, {b.lng.toFixed(5)}
                  </p>
                </div>

                {editingId === b.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      value={editLat}
                      onChange={e => setEditLat(e.target.value)}
                      className="w-24 h-7 text-xs"
                      placeholder="lat"
                      type="number"
                      step="any"
                    />
                    <Input
                      value={editLng}
                      onChange={e => setEditLng(e.target.value)}
                      className="w-24 h-7 text-xs"
                      placeholder="lng"
                      type="number"
                      step="any"
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSave(b.id)}>
                      <Save size={12} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-xs"
                    onClick={() => {
                      setEditingId(b.id);
                      setEditLat(String(b.lat));
                      setEditLng(String(b.lng));
                    }}
                  >
                    Bewerk
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
