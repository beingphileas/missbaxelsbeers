import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Search, CheckCircle, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface BeerVerification {
  id: string;
  name: string;
  style: string;
  abv: number | null;
  verification_status: string | null;
  verification_score: number | null;
  source_count: number | null;
  source_records: any[] | null;
  verified_at: string | null;
  cross_ref_notes: string | null;
  brewery_name?: string;
  brewery_id: string;
}

interface Stats {
  total: number;
  verified: number;
  pending: number;
  unverified: number;
  conflicting: number;
  rejected: number;
}

export default function VerificationDashboard() {
  const [beers, setBeers] = useState<BeerVerification[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, pending: 0, unverified: 0, conflicting: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [discoveryBreweryId, setDiscoveryBreweryId] = useState<string>('');
  const [discovering, setDiscovering] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<any | null>(null);
  const [breweries, setBreweries] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch beers with brewery name
    let query = supabase
      .from('beers')
      .select('id, name, style, abv, verification_status, verification_score, source_count, source_records, verified_at, cross_ref_notes, brewery_id, breweries(name)')
      .order('verification_score', { ascending: true, nullsFirst: true });

    if (filter !== 'all') {
      query = query.eq('verification_status', filter);
    }

    const { data, error } = await query.limit(200);
    if (error) {
      console.error('Fetch error:', error);
    } else {
      setBeers((data ?? []).map((b: any) => ({
        ...b,
        brewery_name: b.breweries?.name ?? 'Onbekend',
      })));
    }

    // Fetch stats
    const { data: allBeers } = await supabase.from('beers').select('verification_status');
    if (allBeers) {
      const s: Stats = { total: allBeers.length, verified: 0, pending: 0, unverified: 0, conflicting: 0, rejected: 0 };
      for (const b of allBeers) {
        const st = b.verification_status ?? 'unverified';
        if (st in s) (s as any)[st]++;
      }
      setStats(s);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch breweries for discovery dropdown
  useEffect(() => {
    supabase.from('breweries').select('id, name').order('name').then(({ data }) => {
      setBreweries(data ?? []);
    });
  }, []);

  const handleDiscover = async () => {
    if (!discoveryBreweryId) {
      toast({ title: 'Selecteer een brouwerij', variant: 'destructive' });
      return;
    }
    setDiscovering(true);
    setDiscoveryResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-beers', {
        body: { brewery_id: discoveryBreweryId, mode: 'discover' },
      });
      if (error) throw error;
      setDiscoveryResults(data);
      toast({ title: `${data.new_count} nieuwe bieren gevonden bij ${data.brewery.name}` });
    } catch (err: any) {
      toast({ title: 'Discovery fout', description: err.message, variant: 'destructive' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleCommitAll = async () => {
    if (!discoveryResults?.candidates?.length) return;
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-beers', {
        body: {
          mode: 'commit',
          beers: discoveryResults.candidates.map((c: any) => ({
            name: c.name,
            brewery_id: c.brewery_id,
            style: c.style,
            abv: c.abv,
            description: c.description,
            confidence: c.confidence,
            sources: c.sources,
          })),
        },
      });
      if (error) throw error;
      toast({ title: `${data.inserted} bieren toegevoegd, ${data.skipped} overgeslagen` });
      setDiscoveryResults(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Commit fout', description: err.message, variant: 'destructive' });
    } finally {
      setDiscovering(false);
    }
  };

  const handleVerifyBrewery = async (breweryId: string) => {
    setVerifying(breweryId);
    try {
      const { data, error } = await supabase.functions.invoke('seed-beers', {
        body: { brewery_id: breweryId, mode: 'verify' },
      });
      if (error) throw error;
      toast({ title: `${data.verified} bieren geverifieerd` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Verify fout', description: err.message, variant: 'destructive' });
    } finally {
      setVerifying(null);
    }
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'verified': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
      case 'conflicting': return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusLabel = (status: string | null) => {
    switch (status) {
      case 'verified': return 'Geverifieerd';
      case 'pending': return 'In review';
      case 'conflicting': return 'Conflicterend';
      case 'rejected': return 'Afgewezen';
      default: return 'Niet geverifieerd';
    }
  };

  const pct = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Totaal', value: stats.total, color: 'text-foreground' },
          { label: 'Geverifieerd', value: stats.verified, color: 'text-emerald-600' },
          { label: 'In review', value: stats.pending, color: 'text-amber-600' },
          { label: 'Niet geverifieerd', value: stats.unverified, color: 'text-muted-foreground' },
          { label: 'Afgewezen', value: stats.rejected, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`font-serif text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Verificatie voortgang</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Discovery tool */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Search size={16} /> Bieren ontdekken per brouwerij
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={discoveryBreweryId} onValueChange={setDiscoveryBreweryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies brouwerij..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {breweries.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleDiscover} disabled={discovering || !discoveryBreweryId} className="gap-1.5">
              {discovering ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Ontdek bieren
            </Button>
          </div>

          {/* Discovery results */}
          {discoveryResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {discoveryResults.new_count} nieuwe bieren gevonden
                  <span className="text-muted-foreground ml-1">
                    ({discoveryResults.existing_count} al in database)
                  </span>
                </p>
                {discoveryResults.candidates.length > 0 && (
                  <Button size="sm" onClick={handleCommitAll} disabled={discovering} className="gap-1.5">
                    {discovering ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Alles toevoegen
                  </Button>
                )}
              </div>

              {discoveryResults.candidates.length > 0 && (
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Naam</th>
                        <th className="px-3 py-2 text-left">Stijl</th>
                        <th className="px-3 py-2 text-right">ABV</th>
                        <th className="px-3 py-2 text-center">Betrouwbaarheid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {discoveryResults.candidates.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-medium">{c.name}</td>
                          <td className="px-3 py-1.5">{c.style}</td>
                          <td className="px-3 py-1.5 text-right">{c.abv != null ? `${c.abv}%` : '—'}</td>
                          <td className="px-3 py-1.5 text-center">
                            <Badge variant="outline" className={
                              c.confidence === 'high' ? 'border-emerald-500 text-emerald-700' :
                              c.confidence === 'medium' ? 'border-amber-500 text-amber-700' :
                              'border-red-500 text-red-700'
                            }>
                              {c.confidence}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {discoveryResults.citations?.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    {discoveryResults.citations.length} bronnen
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {discoveryResults.citations.map((c: string, i: number) => (
                      <li key={i}>
                        <a href={c} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          <ExternalLink size={10} /> {c}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter + Beer list */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldCheck size={16} /> Verificatie overzicht
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="unverified">Niet geverifieerd</SelectItem>
                <SelectItem value="pending">In review</SelectItem>
                <SelectItem value="verified">Geverifieerd</SelectItem>
                <SelectItem value="conflicting">Conflicterend</SelectItem>
                <SelectItem value="rejected">Afgewezen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Laden...</p>
          ) : beers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Geen bieren gevonden met deze filter.</p>
          ) : (
            <div className="divide-y divide-border">
              {beers.map(beer => (
                <div key={beer.id} className="py-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === beer.id ? null : beer.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{beer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {beer.brewery_name} · {beer.style} · {beer.abv != null ? `${beer.abv}%` : '?%'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {beer.verification_score != null && (
                        <span className="text-xs font-mono tabular-nums">{beer.verification_score}/100</span>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${statusColor(beer.verification_status)}`}>
                        {statusLabel(beer.verification_status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {beer.source_count ?? 0} bronnen
                      </span>
                      {expandedId === beer.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === beer.id && (
                    <div className="mt-3 ml-2 p-3 bg-muted/50 rounded-lg space-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyBrewery(beer.brewery_id)}
                          disabled={verifying === beer.brewery_id}
                          className="gap-1 text-xs h-7"
                        >
                          {verifying === beer.brewery_id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          Verifieer alle bieren van deze brouwerij
                        </Button>
                      </div>

                      {beer.cross_ref_notes && (
                        <div>
                          <p className="font-semibold mb-1">Notities:</p>
                          <p className="text-muted-foreground">{beer.cross_ref_notes}</p>
                        </div>
                      )}

                      {/* Source records */}
                      {Array.isArray(beer.source_records) && beer.source_records.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1">Bronrecords:</p>
                          <div className="space-y-1.5">
                            {beer.source_records.map((sr: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                {sr.exists === false ? (
                                  <XCircle size={12} className="text-red-500 shrink-0" />
                                ) : sr.confidence === 'high' ? (
                                  <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                                )}
                                <span className="font-mono">{sr.source}</span>
                                <span>— {sr.confidence}</span>
                                {sr.fetched_at && (
                                  <span className="text-muted-foreground/60">
                                    {new Date(sr.fetched_at).toLocaleDateString('nl-BE')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {beer.verified_at && (
                        <p className="text-muted-foreground/60">
                          Geverifieerd op {new Date(beer.verified_at).toLocaleDateString('nl-BE')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
