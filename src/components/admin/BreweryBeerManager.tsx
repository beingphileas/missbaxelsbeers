import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Trash2, Loader2, List, FlaskConical, ShieldCheck, CheckCircle2, AlertCircle, Pencil, Save, X } from 'lucide-react';
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
  quality_score: number | null;
  analysis_json: any | null;
  factcheck_json: any | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', style: '', abv: '', quality_score: '' });
  const [saving, setSaving] = useState(false);

  // Bulk analysis state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkCurrent, setBulkCurrent] = useState('');

  const fetchBeers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('beers')
      .select('id, name, style, abv, quality_score, analysis_json, factcheck_json')
      .eq('brewery_id', breweryId)
      .order('name');

    if (!error && data) setBeers(data as Beer[]);
    setLoading(false);
  }, [breweryId]);

  useEffect(() => {
    if (open) {
      fetchBeers();
      setSelected(new Set());
      setEditingId(null);
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

  const startEdit = (beer: Beer) => {
    setEditingId(beer.id);
    setEditForm({
      name: beer.name,
      style: beer.style,
      abv: beer.abv != null ? String(beer.abv) : '',
      quality_score: beer.quality_score != null ? String(beer.quality_score) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editForm.name.trim()) {
      toast({ title: 'Naam is verplicht', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const abv = editForm.abv.trim() === '' ? null : parseFloat(editForm.abv);
    const quality_score = editForm.quality_score.trim() === '' ? null : parseInt(editForm.quality_score, 10);

    const { error } = await supabase.from('beers').update({
      name: editForm.name.trim(),
      style: editForm.style.trim() || 'Unknown',
      abv,
      quality_score,
    }).eq('id', editingId);

    if (error) {
      toast({ title: 'Fout bij opslaan', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bier bijgewerkt' });
      setBeers(prev => prev.map(b => b.id === editingId ? {
        ...b,
        name: editForm.name.trim(),
        style: editForm.style.trim() || 'Unknown',
        abv,
        quality_score,
      } : b));
      setEditingId(null);
    }
    setSaving(false);
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

  const handleBulkAnalyze = async (onlyMissing: boolean) => {
    const targets = onlyMissing
      ? beers.filter(b => !b.analysis_json || !b.factcheck_json)
      : beers;

    if (targets.length === 0) {
      toast({ title: 'Alle bieren zijn al geanalyseerd' });
      return;
    }

    setBulkRunning(true);
    setBulkTotal(targets.length);
    setBulkProgress(0);

    let done = 0;
    let errors = 0;

    for (const beer of targets) {
      setBulkCurrent(beer.name);

      try {
        if (!beer.analysis_json || !onlyMissing) {
          const { error } = await supabase.functions.invoke('analyze-beer', {
            body: { beer_id: beer.id },
          });
          if (error) throw error;
        }

        if (!beer.factcheck_json || !onlyMissing) {
          const { error } = await supabase.functions.invoke('factcheck-beer', {
            body: { beer_id: beer.id },
          });
          if (error) throw error;
        }
      } catch (err: any) {
        console.error(`Failed for ${beer.name}:`, err);
        errors++;
      }

      done++;
      setBulkProgress(done);

      if (done < targets.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setBulkRunning(false);
    setBulkCurrent('');
    fetchBeers();

    toast({
      title: `Bulk analyse voltooid`,
      description: `${done - errors}/${targets.length} succesvol${errors > 0 ? `, ${errors} fouten` : ''}`,
    });
  };

  const analyzedCount = beers.filter(b => b.analysis_json).length;
  const factcheckedCount = beers.filter(b => b.factcheck_json).length;
  const missingCount = beers.filter(b => !b.analysis_json || !b.factcheck_json).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground">
          <List size={12} />
          Bieren
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
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
            {/* Stats + bulk actions */}
            <div className="space-y-2 px-1 pb-2 border-b border-border shrink-0">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FlaskConical size={10} /> {analyzedCount}/{beers.length} geanalyseerd
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={10} /> {factcheckedCount}/{beers.length} factchecked
                </span>
              </div>

              {bulkRunning ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 size={12} className="animate-spin text-primary" />
                    <span className="truncate">{bulkCurrent}</span>
                    <span className="text-muted-foreground shrink-0">{bulkProgress}/{bulkTotal}</span>
                  </div>
                  <Progress value={bulkTotal ? (bulkProgress / bulkTotal) * 100 : 0} className="h-1.5" />
                </div>
              ) : (
                <div className="flex gap-2">
                  {missingCount > 0 && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                      onClick={() => handleBulkAnalyze(true)}>
                      <FlaskConical size={11} /> Analyseer ontbrekende ({missingCount})
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                    onClick={() => handleBulkAnalyze(false)}>
                    <FlaskConical size={11} /> Alles (her)analyseren
                  </Button>
                </div>
              )}
            </div>

            {/* Select all + delete */}
            <div className="flex items-center justify-between px-1 py-1.5 shrink-0">
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
                <div key={beer.id}>
                  {editingId === beer.id ? (
                    /* ── Inline edit form ── */
                    <div className="px-3 py-3 space-y-2 bg-muted/30">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Naam</label>
                          <Input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Stijl</label>
                          <Input
                            value={editForm.style}
                            onChange={e => setEditForm(f => ({ ...f, style: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">ABV %</label>
                          <Input
                            type="number" step="0.1" min="0" max="100"
                            value={editForm.abv}
                            onChange={e => setEditForm(f => ({ ...f, abv: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="—"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Score (0-100)</label>
                          <Input
                            type="number" min="0" max="100"
                            value={editForm.quality_score}
                            onChange={e => setEditForm(f => ({ ...f, quality_score: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="N/A"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="gap-1.5 text-xs" onClick={saveEdit} disabled={saving}>
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Opslaan
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={cancelEdit}>
                          <X size={11} /> Annuleer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ── */
                    <div className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50">
                      <Checkbox
                        checked={selected.has(beer.id)}
                        onCheckedChange={() => toggleSelect(beer.id)}
                      />
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => startEdit(beer)}>
                        <p className="text-sm font-medium truncate">{beer.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {beer.style}{beer.abv != null ? ` · ${beer.abv}%` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => startEdit(beer)} className="text-muted-foreground hover:text-foreground transition-colors" title="Bewerken">
                          <Pencil size={12} />
                        </button>
                        {beer.quality_score != null && (
                          <span className="text-[10px] font-bold tabular-nums text-accent">
                            {beer.quality_score < 70 ? 'N/A' : beer.quality_score}
                          </span>
                        )}
                        {beer.analysis_json ? (
                          <CheckCircle2 size={12} className="text-success" />
                        ) : (
                          <AlertCircle size={12} className="text-muted-foreground/40" />
                        )}
                        {beer.factcheck_json ? (
                          <ShieldCheck size={12} className="text-success" />
                        ) : (
                          <ShieldCheck size={12} className="text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
