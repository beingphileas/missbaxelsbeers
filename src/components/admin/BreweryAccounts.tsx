import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Trash2, UserPlus, Mail, Copy } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type BreweryUser = {
  id: string;
  user_id: string;
  brewery_id: string;
  brewery_name: string;
  user_email: string;
  created_at: string;
};

export default function BreweryAccounts() {
  const [accounts, setAccounts] = useState<BreweryUser[]>([]);
  const [breweries, setBreweries] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedBrewery, setSelectedBrewery] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; breweryName: string } | null>(null);

  const fetchAccounts = async () => {
    const { data: links } = await supabase
      .from('brewery_users')
      .select('id, user_id, brewery_id, created_at');

    if (!links || links.length === 0) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const breweryIds = [...new Set(links.map(l => l.brewery_id))];
    const { data: brs } = await supabase
      .from('breweries')
      .select('id, name')
      .in('id', breweryIds);

    const breweryMap = new Map((brs || []).map(b => [b.id, b.name]));

    setAccounts(links.map(l => ({
      ...l,
      brewery_name: breweryMap.get(l.brewery_id) || 'Onbekend',
      user_email: l.user_id.substring(0, 8) + '...',
    })));
    setLoading(false);
  };

  const fetchBreweries = async () => {
    const { data } = await supabase.from('breweries').select('id, name').order('name');
    setBreweries(data || []);
  };

  useEffect(() => {
    fetchAccounts();
    fetchBreweries();
  }, []);

  const handleCreate = async () => {
    if (!newEmail || !newPassword || !selectedBrewery) {
      toast({ title: 'Vul alle velden in', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Wachtwoord moet minimaal 6 tekens zijn', variant: 'destructive' });
      return;
    }

    setCreating(true);

    const { data, error } = await supabase.functions.invoke('create-brewery-user', {
      body: { email: newEmail, password: newPassword, brewery_id: selectedBrewery },
    });

    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else if (data?.error) {
      toast({ title: 'Fout', description: data.error, variant: 'destructive' });
    } else {
      const breweryName = breweries.find(b => b.id === selectedBrewery)?.name || 'Brouwerij';
      setCreatedCreds({ email: newEmail, password: newPassword, breweryName });
      setDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setSelectedBrewery('');
      fetchAccounts();
      toast({ title: 'Account aangemaakt!' });
    }
    setCreating(false);
  };

  const getMailtoLink = () => {
    if (!createdCreds) return '';
    const subject = encodeURIComponent(`Uw login voor MissBaxel's – ${createdCreds.breweryName}`);
    const body = encodeURIComponent(
      `Beste,\n\nUw account voor MissBaxel's Beer Whisperer is aangemaakt.\n\n` +
      `Brouwerij: ${createdCreds.breweryName}\n` +
      `Login-pagina: ${window.location.origin}/login\n` +
      `Email: ${createdCreds.email}\n` +
      `Wachtwoord: ${createdCreds.password}\n\n` +
      `U kunt na het inloggen uw brouwerijgegevens en bieren beheren.\n\n` +
      `Met vriendelijke groeten,\nMissBaxel's Beer Whisperer`
    );
    return `mailto:${createdCreds.email}?subject=${subject}&body=${body}`;
  };

  const copyCredentials = () => {
    if (!createdCreds) return;
    const text =
      `Brouwerij: ${createdCreds.breweryName}\n` +
      `Login: ${window.location.origin}/login\n` +
      `Email: ${createdCreds.email}\n` +
      `Wachtwoord: ${createdCreds.password}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Gekopieerd naar klembord!' });
  };

  const handleDelete = async (account: BreweryUser) => {
    if (!confirm(`Koppeling verwijderen?`)) return;
    const { error } = await supabase.from('brewery_users').delete().eq('id', account.id);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Koppeling verwijderd' });
      fetchAccounts();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Beheer brouwerij-accounts die hun eigen gegevens en bieren kunnen bijwerken.</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><UserPlus size={14} /> Nieuw account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Brouwerij-account aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brouwerij</Label>
                <Select value={selectedBrewery} onValueChange={setSelectedBrewery}>
                  <SelectTrigger><SelectValue placeholder="Kies brouwerij..." /></SelectTrigger>
                  <SelectContent>
                    {breweries.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="brouwerij@voorbeeld.be" />
              </div>
              <div className="space-y-2">
                <Label>Wachtwoord</Label>
                <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 tekens" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Annuleren</Button></DialogClose>
              <Button onClick={handleCreate} disabled={creating}>{creating ? 'Aanmaken...' : 'Account aanmaken'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Laden...</p>
      ) : accounts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nog geen brouwerij-accounts.</p>
      ) : (
        <div className="divide-y divide-border">
          {accounts.map(acc => (
            <div key={acc.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{acc.brewery_name}</span>
                  <Badge variant="secondary" className="text-[10px]">Brouwerij</Badge>
                </div>
                <p className="text-xs text-muted-foreground">User: {acc.user_email} • {new Date(acc.created_at).toLocaleDateString('nl-BE')}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(acc)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
