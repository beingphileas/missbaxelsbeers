import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Trash2, Loader2, List, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Beer {
  id: string;
  name: string;
  style: string;
  abv: number | null;
}

interface BreweryBeerManagerProps {
  breweryId: string;
  breweryName: string;
}

export default function BreweryBeerManager({ breweryId, breweryName }: BreweryBeerManagerProps) {
  const [open, setOpen] = useState(false);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchBeers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('beers')
      .select('id, name, style, abv')
      .eq('brewery_id', breweryId)
      .order('name');

    if (!error && data) setBeers(data);
    setLoading(false);
  }, [breweryId]);

  useEffect(() => {
    if (open) {
      fetchBeers();
      setSelected(new Set());
    }
  }, [open, fetchBeers]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === beers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(beers.map(b => b.id)));
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} bier(en) verwijderen van ${breweryName}?`)) return;

    setDeleting(true);
    const { error } = await supabase.from('beers').delete().in('id', [...selected]);
    if (error) {
      toast({ title: 'Fout bij verwijderen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${selected.size} bier(en) verwijderd` });
      setSelected(new Set());
      fetchBeers();
    }
    setDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground">
          <List size={12} />
          Bieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">{breweryName} — Bieren</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : beers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Geen bieren gevonden.</p>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pb-2 border-b border-border shrink-0">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={selected.size === beers.length}
                  onCheckedChange={toggleAll}
                />
                Alles ({beers.length})
              </label>
              {selected.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Verwijder {selected.size}
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {beers.map(beer => (
                <label
                  key={beer.id}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(beer.id)}
                    onCheckedChange={() => toggleSelect(beer.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{beer.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {beer.style}{beer.abv != null ? ` · ${beer.abv}%` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
