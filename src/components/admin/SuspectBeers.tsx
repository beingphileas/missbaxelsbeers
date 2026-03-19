import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, ShieldAlert, RefreshCw, Loader2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SuspectBeer {
  id: string;
  name: string;
  style: string;
  abv: number | null;
  beer_status: string | null;
  quality_score: number | null;
  brewery_name: string;
  factcheck_confidence: number | null;
  factcheck_beer_exists: boolean | null;
}

export default function SuspectBeers() {
  const [beers, setBeers] = useState<SuspectBeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'suspect' | 'no-abv' | 'low-confidence' | 'all'>('suspect');

  const fetchBeers = async () => {
    setLoading(true);
    // Fetch all beers with brewery name
    const { data, error } = await supabase
      .from('beers')
      .select('id, name, style, abv, beer_status, quality_score, factcheck_json, breweries:brewery_id(name)')
      .order('name');

    if (error) {
      toast({ title: 'Fout bij laden', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((b: any) => ({
      id: b.id,
      name: b.name,
      style: b.style,
      abv: b.abv,
      beer_status: b.beer_status,
      quality_score: b.quality_score,
      brewery_name: b.breweries?.name ?? 'Onbekend',
      factcheck_confidence: b.factcheck_json?.confidence_score ?? null,
      factcheck_beer_exists: b.factcheck_json?.beer_exists ?? null,
    }));

    setBeers(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchBeers(); }, []);

  const getFiltered = () => {
    switch (filter) {
      case 'suspect':
        return beers.filter(b => b.beer_status === 'suspect' || b.factcheck_beer_exists === false);
      case 'no-abv':
        return beers.filter(b => b.abv === null || b.abv === 0);
      case 'low-confidence':
        return beers.filter(b => b.factcheck_confidence !== null && b.factcheck_confidence <= 30);
      case 'all':
        return beers.filter(b =>
          b.beer_status === 'suspect' ||
          b.factcheck_beer_exists === false ||
          b.abv === null || b.abv === 0 ||
          (b.factcheck_confidence !== null && b.factcheck_confidence <= 30)
        );
    }
  };

  const filtered = getFiltered();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;
    const { error } = await supabase.from('beers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Verwijderen mislukt', variant: 'destructive' });
    } else {
      setBeers(prev => prev.filter(b => b.id !== id));
      toast({ title: `${name} verwijderd` });
    }
  };

  const handleClearStatus = async (id: string) => {
    const { error } = await supabase.from('beers').update({ beer_status: 'active' }).eq('id', id);
    if (error) {
      toast({ title: 'Status bijwerken mislukt', variant: 'destructive' });
    } else {
      setBeers(prev => prev.map(b => b.id === id ? { ...b, beer_status: 'active' } : b));
    }
  };

  const suspectCount = beers.filter(b => b.beer_status === 'suspect' || b.factcheck_beer_exists === false).length;
  const noAbvCount = beers.filter(b => b.abv === null || b.abv === 0).length;
  const lowConfCount = beers.filter(b => b.factcheck_confidence !== null && b.factcheck_confidence <= 30).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{beers.length} bieren totaal</span>
        {suspectCount > 0 && <Badge variant="destructive">{suspectCount} suspect</Badge>}
        {noAbvCount > 0 && <Badge variant="secondary">{noAbvCount} geen ABV</Badge>}
        {lowConfCount > 0 && <Badge variant="outline">{lowConfCount} lage confidence</Badge>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'suspect' as const, label: `Suspect (${suspectCount})` },
          { value: 'no-abv' as const, label: `Geen ABV (${noAbvCount})` },
          { value: 'low-confidence' as const, label: `Lage confidence (${lowConfCount})` },
          { value: 'all' as const, label: 'Alles verdacht' },
        ].map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={fetchBeers} disabled={loading} className="ml-auto gap-1.5">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Ververs
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldAlert size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Geen verdachte bieren gevonden in deze categorie.</p>
        </div>
      ) : (
        <div className="border rounded-lg max-h-[500px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left">Bier</th>
                <th className="px-3 py-2 text-left">Brouwerij</th>
                <th className="px-3 py-2 text-left">Stijl</th>
                <th className="px-3 py-2 text-left w-14">ABV</th>
                <th className="px-3 py-2 text-left w-20">Confidence</th>
                <th className="px-3 py-2 text-left w-20">Status</th>
                <th className="px-3 py-2 text-right w-28">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(beer => (
                <tr key={beer.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{beer.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{beer.brewery_name}</td>
                  <td className="px-3 py-2">{beer.style}</td>
                  <td className="px-3 py-2">{beer.abv ? `${beer.abv}%` : <span className="text-destructive">—</span>}</td>
                  <td className="px-3 py-2">
                    {beer.factcheck_confidence !== null ? (
                      <span className={beer.factcheck_confidence <= 30 ? 'text-destructive font-bold' : ''}>
                        {beer.factcheck_confidence}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {beer.beer_status === 'suspect' && <Badge variant="destructive" className="text-[9px]">suspect</Badge>}
                    {beer.factcheck_beer_exists === false && <Badge variant="destructive" className="text-[9px]">bestaat niet</Badge>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/beers/${beer.id}`}>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye size={12} />
                        </Button>
                      </Link>
                      {beer.beer_status === 'suspect' && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleClearStatus(beer.id)}>
                          OK
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(beer.id, beer.name)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
