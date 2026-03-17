import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

type PendingChange = {
  id: string;
  brewery_id: string;
  submitted_by: string;
  entity_type: string;
  entity_id: string | null;
  change_type: string;
  payload: any;
  status: string;
  review_note: string | null;
  created_at: string;
  brewery_name?: string;
};

export default function PendingChanges({ onApproved }: { onApproved?: () => void }) {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchChanges = async () => {
    const { data } = await supabase
      .from('pending_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const breweryIds = [...new Set(data.map(d => d.brewery_id))];
      const { data: brs } = await supabase.from('breweries').select('id, name').in('id', breweryIds);
      const bMap = new Map((brs || []).map(b => [b.id, b.name]));

      setChanges(data.map(d => ({ ...d, brewery_name: bMap.get(d.brewery_id) || '?' })) as PendingChange[]);
    } else {
      setChanges([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchChanges(); }, []);

  const handleAction = async (change: PendingChange, action: 'approved' | 'rejected') => {
    setProcessing(change.id);

    if (action === 'approved') {
      // Apply the change
      const { error: applyError } = await applyChange(change);
      if (applyError) {
        toast({ title: 'Fout bij toepassen', description: applyError, variant: 'destructive' });
        setProcessing(null);
        return;
      }
    }

    const { error } = await supabase
      .from('pending_changes')
      .update({
        status: action,
        reviewed_by: (await supabase.auth.getUser()).data.user!.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNotes[change.id] || null,
      })
      .eq('id', change.id);

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: action === 'approved' ? 'Goedgekeurd ✓' : 'Afgewezen' });
      fetchChanges();
      onApproved?.();
    }
    setProcessing(null);
  };

  const applyChange = async (change: PendingChange): Promise<{ error?: string }> => {
    try {
      if (change.entity_type === 'brewery' && change.change_type === 'update') {
        const { error } = await supabase
          .from('breweries')
          .update(change.payload)
          .eq('id', change.entity_id!);
        if (error) return { error: error.message };
      } else if (change.entity_type === 'beer') {
        if (change.change_type === 'create') {
          const { error } = await supabase.from('beers').insert({
            ...change.payload,
            brewery_id: change.brewery_id,
          });
          if (error) return { error: error.message };
        } else if (change.change_type === 'update') {
          const { error } = await supabase
            .from('beers')
            .update(change.payload)
            .eq('id', change.entity_id!);
          if (error) return { error: error.message };
        } else if (change.change_type === 'delete') {
          const { error } = await supabase
            .from('beers')
            .delete()
            .eq('id', change.entity_id!);
          if (error) return { error: error.message };
        }
      }
      return {};
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const pendingCount = changes.filter(c => c.status === 'pending').length;

  if (loading) return <p className="text-muted-foreground text-center py-8">Laden...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {pendingCount > 0 ? `${pendingCount} wijziging(en) wachten op review` : 'Geen openstaande wijzigingen'}
        </p>
      </div>

      {changes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Geen wijzigingen.</p>
      ) : (
        <div className="divide-y divide-border">
          {changes.map(change => (
            <div key={change.id} className="py-4 space-y-2">
              <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === change.id ? null : change.id)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {change.status === 'pending' ? <Clock size={14} className="text-accent" /> : change.status === 'approved' ? <CheckCircle size={14} className="text-success" /> : <XCircle size={14} className="text-destructive" />}
                    <span className="font-medium text-sm">{change.brewery_name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {change.change_type === 'create' ? 'Nieuw' : change.change_type === 'update' ? 'Wijziging' : 'Verwijdering'} {change.entity_type}
                    </Badge>
                    {change.entity_type === 'beer' && change.payload?.name && (
                      <span className="text-xs text-muted-foreground">"{change.payload.name}"</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(change.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {change.status === 'pending' ? (
                    expandedId === change.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  ) : (
                    <Badge variant={change.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                      {change.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'}
                    </Badge>
                  )}
                </div>
              </div>

              {expandedId === change.id && change.status === 'pending' && (
                <div className="ml-6 space-y-3 pt-2">
                  <pre className="bg-muted/50 rounded p-3 text-xs overflow-auto max-h-40">
                    {JSON.stringify(change.payload, null, 2)}
                  </pre>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Optionele opmerking..."
                      className="text-sm h-8"
                      value={reviewNotes[change.id] || ''}
                      onChange={e => setReviewNotes({ ...reviewNotes, [change.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
                      disabled={processing === change.id}
                      onClick={() => handleAction(change, 'approved')}
                    >
                      <CheckCircle size={12} /> Goedkeuren
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={processing === change.id}
                      onClick={() => handleAction(change, 'rejected')}
                    >
                      <XCircle size={12} /> Afwijzen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
