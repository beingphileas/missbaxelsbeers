import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBreweryUser } from '@/hooks/useBreweryUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { LogOut, Save, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Beer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

type BreweryData = {
  address: string;
  phone: string;
  email: string;
  website_url: string;
  story: string;
};

type BeerRow = {
  id: string;
  name: string;
  style: string;
  abv: number | null;
  description: string | null;
};

type PendingChange = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  change_type: string;
  payload: any;
  status: string;
  review_note: string | null;
  created_at: string;
};

export default function BreweryPortal() {
  const { breweryLink, isAdmin, loading } = useBreweryUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [brewery, setBrewery] = useState<BreweryData | null>(null);
  const [beers, setBeers] = useState<BeerRow[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [saving, setSaving] = useState(false);

  // Beer editor state
  const [editBeer, setEditBeer] = useState<Partial<BeerRow> | null>(null);
  const [beerDialogOpen, setBeerDialogOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!breweryLink) return;

    const fetchData = async () => {
      const [{ data: b }, { data: brs }, { data: pc }] = await Promise.all([
        supabase.from('breweries').select('address, phone, email, website_url, story').eq('id', breweryLink.brewery_id).single(),
        supabase.from('beers').select('id, name, style, abv, description').eq('brewery_id', breweryLink.brewery_id).order('name'),
        supabase.from('pending_changes').select('*').eq('brewery_id', breweryLink.brewery_id).order('created_at', { ascending: false }),
      ]);
      if (b) setBrewery(b as BreweryData);
      setBeers((brs || []) as BeerRow[]);
      setPendingChanges((pc || []) as PendingChange[]);
    };
    fetchData();
  }, [breweryLink, loading]);

  if (loading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Laden...</p></div>;
  }

  if (!breweryLink) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="max-w-sm w-full shadow-card text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <Beer size={32} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Je account is niet gekoppeld aan een brouwerij.</p>
            <p className="text-sm text-muted-foreground">Neem contact op met de beheerder.</p>
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>Naar Admin Dashboard</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveBrewery = async () => {
    if (!brewery) return;
    setSaving(true);

    const { error } = await supabase.from('pending_changes').insert({
      brewery_id: breweryLink.brewery_id,
      submitted_by: (await supabase.auth.getUser()).data.user!.id,
      entity_type: 'brewery',
      entity_id: breweryLink.brewery_id,
      change_type: 'update',
      payload: brewery,
    });

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Wijziging ingediend', description: 'Je wijzigingen wachten op goedkeuring van de beheerder.' });
      // Refresh pending
      const { data } = await supabase.from('pending_changes').select('*').eq('brewery_id', breweryLink.brewery_id).order('created_at', { ascending: false });
      setPendingChanges((data || []) as PendingChange[]);
    }
    setSaving(false);
  };

  const handleSaveBeer = async () => {
    if (!editBeer?.name || !editBeer?.style) {
      toast({ title: 'Vul naam en stijl in', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const isNew = !editBeer.id;
    const { error } = await supabase.from('pending_changes').insert({
      brewery_id: breweryLink.brewery_id,
      submitted_by: (await supabase.auth.getUser()).data.user!.id,
      entity_type: 'beer',
      entity_id: isNew ? null : editBeer.id,
      change_type: isNew ? 'create' : 'update',
      payload: {
        name: editBeer.name,
        style: editBeer.style,
        abv: editBeer.abv,
        description: editBeer.description,
      },
    });

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isNew ? 'Nieuw bier ingediend' : 'Wijziging ingediend', description: 'Wacht op goedkeuring.' });
      setBeerDialogOpen(false);
      setEditBeer(null);
      const { data } = await supabase.from('pending_changes').select('*').eq('brewery_id', breweryLink.brewery_id).order('created_at', { ascending: false });
      setPendingChanges((data || []) as PendingChange[]);
    }
    setSaving(false);
  };

  const handleDeleteBeer = async (beer: BeerRow) => {
    if (!confirm(`Wil je "${beer.name}" verwijderen? Dit wordt ingediend ter goedkeuring.`)) return;

    const { error } = await supabase.from('pending_changes').insert({
      brewery_id: breweryLink.brewery_id,
      submitted_by: (await supabase.auth.getUser()).data.user!.id,
      entity_type: 'beer',
      entity_id: beer.id,
      change_type: 'delete',
      payload: { name: beer.name },
    });

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Verwijdering ingediend', description: 'Wacht op goedkeuring.' });
      const { data } = await supabase.from('pending_changes').select('*').eq('brewery_id', breweryLink.brewery_id).order('created_at', { ascending: false });
      setPendingChanges((data || []) as PendingChange[]);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'pending') return <Clock size={14} className="text-accent" />;
    if (status === 'approved') return <CheckCircle size={14} className="text-success" />;
    return <XCircle size={14} className="text-destructive" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'pending') return 'In behandeling';
    if (status === 'approved') return 'Goedgekeurd';
    return 'Afgewezen';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl">{breweryLink.brewery_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Brouwerij-portaal</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut size={16} />
          </Button>
        </div>

        {/* Pending changes banner */}
        {pendingChanges.filter(p => p.status === 'pending').length > 0 && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="pt-4 pb-3 flex items-center gap-2">
              <Clock size={16} className="text-accent shrink-0" />
              <p className="text-sm">
                <strong>{pendingChanges.filter(p => p.status === 'pending').length}</strong> wijziging(en) wachten op goedkeuring
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Brouwerij-info</TabsTrigger>
            <TabsTrigger value="beers">Bieren ({beers.length})</TabsTrigger>
            <TabsTrigger value="history">Geschiedenis</TabsTrigger>
          </TabsList>

          {/* Brewery Info Tab */}
          <TabsContent value="info">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Basisgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brewery && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Adres</Label>
                        <Input value={brewery.address || ''} onChange={e => setBrewery({ ...brewery, address: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefoon</Label>
                        <Input value={brewery.phone || ''} onChange={e => setBrewery({ ...brewery, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={brewery.email || ''} onChange={e => setBrewery({ ...brewery, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input value={brewery.website_url || ''} onChange={e => setBrewery({ ...brewery, website_url: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Verhaal</Label>
                      <Textarea rows={5} value={brewery.story || ''} onChange={e => setBrewery({ ...brewery, story: e.target.value })} />
                    </div>
                    <Button onClick={handleSaveBrewery} disabled={saving} className="gap-1.5">
                      <Save size={14} /> {saving ? 'Indienen...' : 'Wijzigingen indienen'}
                    </Button>
                    <p className="text-xs text-muted-foreground">Wijzigingen worden ter goedkeuring ingediend bij de beheerder.</p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Beers Tab */}
          <TabsContent value="beers">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Bieren</CardTitle>
                <Dialog open={beerDialogOpen} onOpenChange={setBeerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5" onClick={() => setEditBeer({ name: '', style: '', abv: null, description: '' })}>
                      <Plus size={14} /> Nieuw bier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">{editBeer?.id ? 'Bier bewerken' : 'Nieuw bier'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Naam *</Label>
                        <Input value={editBeer?.name || ''} onChange={e => setEditBeer({ ...editBeer, name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stijl *</Label>
                          <Input value={editBeer?.style || ''} onChange={e => setEditBeer({ ...editBeer, style: e.target.value })} placeholder="Tripel, Blond, IPA..." />
                        </div>
                        <div className="space-y-2">
                          <Label>ABV %</Label>
                          <Input type="number" step="0.1" value={editBeer?.abv ?? ''} onChange={e => setEditBeer({ ...editBeer, abv: e.target.value ? parseFloat(e.target.value) : null })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Beschrijving</Label>
                        <Textarea rows={3} value={editBeer?.description || ''} onChange={e => setEditBeer({ ...editBeer, description: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Annuleren</Button></DialogClose>
                      <Button onClick={handleSaveBeer} disabled={saving}>{saving ? 'Indienen...' : 'Indienen ter goedkeuring'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {beers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nog geen bieren gevonden.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {beers.map(beer => (
                      <div key={beer.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium truncate">{beer.name}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{beer.style}</Badge>
                            {beer.abv && <span className="text-xs text-muted-foreground">{beer.abv}%</span>}
                          </div>
                          {beer.description && <p className="text-xs text-muted-foreground truncate">{beer.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => { setEditBeer(beer); setBeerDialogOpen(true); }}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBeer(beer)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Ingediende wijzigingen</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingChanges.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nog geen wijzigingen ingediend.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingChanges.map(pc => (
                      <div key={pc.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            {statusIcon(pc.status)}
                            <span className="text-sm font-medium">
                              {pc.change_type === 'create' ? 'Nieuw' : pc.change_type === 'update' ? 'Wijziging' : 'Verwijdering'}{' '}
                              {pc.entity_type === 'brewery' ? 'brouwerij-info' : `bier: ${pc.payload?.name || '?'}`}
                            </span>
                            <Badge variant={pc.status === 'pending' ? 'secondary' : pc.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                              {statusLabel(pc.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(pc.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {pc.review_note && <p className="text-xs text-muted-foreground mt-1">💬 {pc.review_note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
