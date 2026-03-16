import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface FeaturedItem {
  id: string;
  name: string;
  featured: boolean;
  extra?: string;
}

export default function FeaturedManager() {
  const [breweries, setBreweries] = useState<FeaturedItem[]>([]);
  const [beers, setBeers] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const load = async () => {
    const [{ data: bData }, { data: beData }] = await Promise.all([
      supabase.from('breweries').select('id, name, featured, type').order('name'),
      supabase.from('beers').select('id, name, featured, style, brewery_id, breweries:brewery_id(name)').order('name'),
    ]);
    setBreweries((bData ?? []).map(b => ({ id: b.id, name: b.name, featured: b.featured, extra: b.type })));
    setBeers((beData ?? []).map(b => ({ id: b.id, name: b.name, featured: b.featured, extra: `${(b as any).breweries?.name ?? ''} · ${b.style}` })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (table: 'breweries' | 'beers', id: string, current: boolean) => {
    const { error } = await supabase.from(table).update({ featured: !current }).eq('id', id);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
      return;
    }
    if (table === 'breweries') {
      setBreweries(prev => prev.map(b => b.id === id ? { ...b, featured: !current } : b));
    } else {
      setBeers(prev => prev.map(b => b.id === id ? { ...b, featured: !current } : b));
    }
    queryClient.invalidateQueries({ queryKey: ['breweries'] });
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Laden...</p>;

  const Section = ({ title, items, table }: { title: string; items: FeaturedItem[]; table: 'breweries' | 'beers' }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-accent" />
        <h3 className="font-serif text-lg">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {items.filter(i => i.featured).length} uitgelicht
        </span>
      </div>
      <div className="divide-y divide-border">
        {items.map(item => (
          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">{item.name}</span>
              {item.extra && <span className="text-xs text-muted-foreground ml-2">{item.extra}</span>}
            </div>
            <Switch
              checked={item.featured}
              onCheckedChange={() => toggle(table, item.id, item.featured)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <Section title="Brouwerijen" items={breweries} table="breweries" />
      <Section title="Bieren" items={beers} table="beers" />
    </div>
  );
}
