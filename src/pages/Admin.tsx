import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBlogPosts } from '@/data/blog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye, MapPin, CheckCircle, ShieldCheck, Users, ClipboardCheck, Beer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import QuickTasting from '@/components/admin/QuickTasting';
import { Link, useNavigate } from 'react-router-dom';
import BlogEditor from '@/components/admin/BlogEditor';
import VenueEditor from '@/components/admin/VenueEditor';
import CoordFixer from '@/components/admin/CoordFixer';
import FeaturedManager from '@/components/admin/FeaturedManager';
import BreweryImport from '@/components/admin/BreweryImport';
import BeerImport from '@/components/admin/BeerImport';
import FactChecker from '@/components/admin/FactChecker';
import BulkFactCheck from '@/components/admin/BulkFactCheck';
import BreweryAccounts from '@/components/admin/BreweryAccounts';
import PendingChanges from '@/components/admin/PendingChanges';
import BreweryEditor from '@/components/admin/BreweryEditor';
import BulkStoryGenerator from '@/components/admin/BulkStoryGenerator';
import { useQueryClient } from '@tanstack/react-query';

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: posts = [], isLoading } = useBlogPosts();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const [editingBreweryId, setEditingBreweryId] = useState<string | null>(null);
  const [showBreweryEditor, setShowBreweryEditor] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Blog posts
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Venues
  const [allVenues, setAllVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // Breweries
  const [allBreweries, setAllBreweries] = useState<any[]>([]);
  const [loadingBreweries, setLoadingBreweries] = useState(true);
  const [brewerySearch, setBrewerySearch] = useState('');

  useState(() => {
    supabase
      .from('blog_posts')
      .select('*, breweries:brewery_id(name), beers:beer_id(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAllPosts(data ?? []);
        setLoadingPosts(false);
      });

    supabase
      .from('venues')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setAllVenues(data ?? []);
        setLoadingVenues(false);
      });

    supabase
      .from('breweries')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setAllBreweries(data ?? []);
        setLoadingBreweries(false);
      });
  });

  const refreshPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*, breweries:brewery_id(name), beers:beer_id(name)')
      .order('created_at', { ascending: false });
    setAllPosts(data ?? []);
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
  };

  const refreshVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('name');
    setAllVenues(data ?? []);
    queryClient.invalidateQueries({ queryKey: ['venues'] });
  };

  const refreshBreweries = async () => {
    const { data } = await supabase
      .from('breweries')
      .select('*')
      .order('name');
    setAllBreweries(data ?? []);
    queryClient.invalidateQueries({ queryKey: ['breweries'] });
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post verwijderd' });
      refreshPosts();
    }
  };

  const handleDeleteVenue = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;
    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Venue verwijderd' });
      refreshVenues();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Show editors full-screen
  if (showBlogEditor || editingPostId) {
    return (
      <BlogEditor
        postId={editingPostId}
        onClose={() => {
          setShowBlogEditor(false);
          setEditingPostId(null);
          refreshPosts();
        }}
      />
    );
  }

  if (showVenueEditor || editingVenueId !== null) {
    return (
      <VenueEditor
        venueId={editingVenueId}
        onClose={() => {
          setShowVenueEditor(false);
          setEditingVenueId(null);
          refreshVenues();
        }}
      />
    );
  }

  if (showBreweryEditor || editingBreweryId !== null) {
    return (
      <BreweryEditor
        breweryId={editingBreweryId}
        onClose={() => {
          setShowBreweryEditor(false);
          setEditingBreweryId(null);
          refreshBreweries();
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut size={16} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <p className="font-serif text-3xl text-accent">
                {allPosts.filter(p => p.status === 'published').length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Gepubliceerd</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <p className="font-serif text-3xl text-accent">
                {allPosts.filter(p => p.status === 'draft').length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Concepten</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <p className="font-serif text-3xl text-accent">{allVenues.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Venues</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center">
              <p className="font-serif text-3xl text-accent">
                {allVenues.filter(v => v.is_verified).length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        {/* Quick Tasting */}
        <div className="mb-8">
          <QuickTasting onPublished={refreshPosts} />
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="posts">Blog Posts</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="breweries-list" className="gap-1.5">
              <Beer size={12} /> Brouwerijen
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <ClipboardCheck size={12} /> Moderatie
            </TabsTrigger>
            <TabsTrigger value="brewery-accounts" className="gap-1.5">
              <Users size={12} /> Brouwerij-accounts
            </TabsTrigger>
            <TabsTrigger value="breweries-import">Brouwerijen Import</TabsTrigger>
            <TabsTrigger value="beers-import">Bieren Import</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="fact-check" className="gap-1.5">
              <ShieldCheck size={12} /> Fact-check
            </TabsTrigger>
            <TabsTrigger value="bulk-factcheck" className="gap-1.5">
              <ShieldCheck size={12} /> Bulk Factcheck
            </TabsTrigger>
            <TabsTrigger value="bulk-stories" className="gap-1.5">
              <BookOpen size={12} /> Bulk Verhalen
            </TabsTrigger>
            <TabsTrigger value="coords">Kaart-fixes</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Blog Posts</CardTitle>
                <Button onClick={() => setShowBlogEditor(true)} size="sm" className="gap-1.5">
                  <Plus size={14} /> Nieuwe Post
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPosts ? (
                  <p className="text-muted-foreground py-8 text-center">Laden...</p>
                ) : allPosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">Nog geen posts.</p>
                    <Button onClick={() => setShowBlogEditor(true)} className="gap-1.5">
                      <Plus size={16} /> Nieuwe Post
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {allPosts.map(post => (
                      <div key={post.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{post.title}</h3>
                            <Badge
                              variant={post.status === 'published' ? 'default' : 'secondary'}
                              className="shrink-0 text-[10px]"
                            >
                              {post.status === 'published' ? 'Live' : 'Concept'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {post.breweries?.name && <span>🏭 {post.breweries.name}</span>}
                            {post.beers?.name && <span>🍺 {post.beers.name}</span>}
                            <span>{new Date(post.created_at).toLocaleDateString('nl-BE')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {post.status === 'published' && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/post/${post.slug}`}><Eye size={14} /></Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setEditingPostId(post.id)}>
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePost(post.id, post.title)}
                          >
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

          {/* Venues Tab */}
          <TabsContent value="venues">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Venues</CardTitle>
                <Button onClick={() => setShowVenueEditor(true)} size="sm" className="gap-1.5">
                  <Plus size={14} /> Nieuwe Venue
                </Button>
              </CardHeader>
              <CardContent>
                {loadingVenues ? (
                  <p className="text-muted-foreground py-8 text-center">Laden...</p>
                ) : allVenues.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">Nog geen venues.</p>
                    <Button onClick={() => setShowVenueEditor(true)} className="gap-1.5">
                      <Plus size={16} /> Nieuwe Venue
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {allVenues.map(venue => (
                      <div key={venue.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{venue.name}</h3>
                            {venue.is_verified && (
                              <Badge variant="default" className="shrink-0 text-[10px] gap-0.5 bg-success text-success-foreground">
                                <CheckCircle size={10} /> Verified
                              </Badge>
                            )}
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {venue.venue_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {venue.province}
                            </span>
                            {venue.address && <span>{venue.address}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => setEditingVenueId(venue.id)}>
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteVenue(venue.id, venue.name)}
                          >
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

          {/* Brouwerijen List Tab */}
          <TabsContent value="breweries-list">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Brouwerijen</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    value={brewerySearch}
                    onChange={e => setBrewerySearch(e.target.value)}
                    placeholder="Zoek brouwerij..."
                    className="h-9 w-56 text-sm"
                  />
                  <Button onClick={() => setShowBreweryEditor(true)} size="sm" className="gap-1.5">
                    <Plus size={14} /> Nieuw
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBreweries ? (
                  <p className="text-muted-foreground py-8 text-center">Laden...</p>
                ) : (
                  <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {allBreweries
                      .filter(b => !brewerySearch || b.name.toLowerCase().includes(brewerySearch.toLowerCase()))
                      .map(brewery => (
                      <div key={brewery.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm truncate">{brewery.name}</h3>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">{brewery.type}</Badge>
                            {brewery.featured && (
                              <Badge variant="default" className="shrink-0 text-[10px]">Featured</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {brewery.province}</span>
                            {brewery.address && <span className="truncate max-w-[200px]">{brewery.address}</span>}
                            {brewery.established_year && <span>Est. {brewery.established_year}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {(brewery as any).google_rating != null && (
                              <span className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 inline-flex items-center gap-1 rounded-sm">
                                <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                <span className="font-bold">{Number((brewery as any).google_rating).toFixed(1)}</span>
                              </span>
                            )}
                            {(brewery as any).untappd_rating != null && (
                              <span className="text-[10px] bg-secondary px-1.5 py-0.5 border border-border/60 inline-flex items-center gap-1 rounded-sm">
                                <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0"><path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7L12 2z" fill="#FFC000"/></svg>
                                <span className="font-bold">{Number((brewery as any).untappd_rating).toFixed(1)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => setEditingBreweryId(brewery.id)}>
                            <Edit size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Featured Content</CardTitle>
              </CardHeader>
              <CardContent>
                <FeaturedManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brewery Import Tab */}
          <TabsContent value="breweries-import">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Brouwerijen Import / Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <BreweryImport onComplete={() => queryClient.invalidateQueries({ queryKey: ['breweries'] })} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Beers Import Tab */}
          <TabsContent value="beers-import">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Bieren Import / Fuzzy Match</CardTitle>
              </CardHeader>
              <CardContent>
                <BeerImport onComplete={() => queryClient.invalidateQueries({ queryKey: ['beers'] })} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fact-check Tab */}
          <TabsContent value="fact-check">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <ShieldCheck size={18} /> AI Fact-check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FactChecker />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Factcheck Tab */}
          <TabsContent value="bulk-factcheck">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <ShieldCheck size={18} /> Bulk AI Factcheck
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkFactCheck />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Changes / Moderation Tab */}
          <TabsContent value="pending">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <ClipboardCheck size={18} /> Moderatie — ingediende wijzigingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PendingChanges onApproved={() => queryClient.invalidateQueries()} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brewery Accounts Tab */}
          <TabsContent value="brewery-accounts">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Users size={18} /> Brouwerij-accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BreweryAccounts />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coords Tab */}
          <TabsContent value="coords">
            <CoordFixer />
          </TabsContent>

          {/* Bulk Stories Tab */}
          <TabsContent value="bulk-stories">
            <BulkStoryGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
