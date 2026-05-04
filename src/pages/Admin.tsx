import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye, Beer as BeerIcon, FileText, Star, ShieldCheck, Archive, RefreshCw } from 'lucide-react';
import QuickTasting from '@/components/admin/QuickTasting';
import FeaturedManager from '@/components/admin/FeaturedManager';
import FactChecker from '@/components/admin/FactChecker';
import BulkFactCheck from '@/components/admin/BulkFactCheck';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import BeerEditor from '@/components/admin/BeerEditor';

const BlogEditor = lazy(() => import('@/components/admin/BlogEditor'));

const TabFallback = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-6 w-1/4" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export default function Admin() {
  const { user, signOut } = useAuth();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingBeerId, setEditingBeerId] = useState<string | null>(null);
  const [showBeerEditor, setShowBeerEditor] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [allBeers, setAllBeers] = useState<any[]>([]);
  const [loadingBeers, setLoadingBeers] = useState(true);

  useEffect(() => {
    refreshPosts();
    refreshBeers();
  }, []);

  const refreshPosts = async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('*, beers:beer_id(name)')
      .order('created_at', { ascending: false });
    setAllPosts(data ?? []);
    setLoadingPosts(false);
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
  };

  const refreshBeers = async () => {
    setLoadingBeers(true);
    const { data } = await supabase
      .from('beers')
      .select('*')
      .order('name');
    setAllBeers(data ?? []);
    setLoadingBeers(false);
    queryClient.invalidateQueries({ queryKey: ['beers'] });
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Verwijder "${title}"?`)) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Post verwijderd' }); refreshPosts(); }
  };

  const handleDeleteBeer = async (id: string, name: string) => {
    if (!confirm(`Verwijder "${name}"?`)) return;
    const { error } = await supabase.from('beers').delete().eq('id', id);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Bier verwijderd' }); refreshBeers(); }
  };

  const handleToggleArchive = async (beer: any) => {
    const next = beer.lifecycle_status === 'archive' ? 'current' : 'archive';
    const { error } = await supabase.from('beers').update({ lifecycle_status: next }).eq('id', beer.id);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else { toast({ title: next === 'archive' ? 'Naar archief verplaatst' : 'Terug in assortiment' }); refreshBeers(); }
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (showBlogEditor || editingPostId) {
    return (
      <Suspense fallback={<TabFallback />}>
        <BlogEditor
          postId={editingPostId}
          onClose={() => { setShowBlogEditor(false); setEditingPostId(null); refreshPosts(); }}
        />
      </Suspense>
    );
  }

  if (showBeerEditor || editingBeerId) {
    return (
      <BeerEditor
        beerId={editingBeerId}
        onClose={() => { setShowBeerEditor(false); setEditingBeerId(null); refreshBeers(); }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center">
            <p className="font-serif text-3xl text-accent">{allPosts.filter(p => p.status === 'published').length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Gepubliceerd</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="font-serif text-3xl text-accent">{allBeers.filter(b => b.lifecycle_status === 'current').length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Huidig</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="font-serif text-3xl text-accent">{allBeers.filter(b => b.lifecycle_status === 'archive').length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Archief</p>
          </CardContent></Card>
        </div>

        <div className="mb-8">
          <QuickTasting onPublished={refreshPosts} />
        </div>

        <Tabs defaultValue="posts">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="posts" className="gap-1.5"><FileText size={12} /> Verhalen</TabsTrigger>
            <TabsTrigger value="beers" className="gap-1.5"><BeerIcon size={12} /> Bieren</TabsTrigger>
            <TabsTrigger value="featured" className="gap-1.5"><Star size={12} /> Featured</TabsTrigger>
            <TabsTrigger value="fact-check" className="gap-1.5"><ShieldCheck size={12} /> Fact-check</TabsTrigger>
            <TabsTrigger value="bulk-factcheck" className="gap-1.5"><ShieldCheck size={12} /> Bulk</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Verhalen</CardTitle>
                <Button onClick={() => setShowBlogEditor(true)} size="sm" className="gap-1.5">
                  <Plus size={14} /> Nieuw
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPosts ? <p className="text-center py-6 text-muted-foreground">Laden…</p>
                : allPosts.length === 0 ? <p className="text-center py-12 text-muted-foreground">Nog geen verhalen.</p>
                : (
                  <div className="divide-y divide-border">
                    {allPosts.map(post => (
                      <div key={post.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{post.title}</h3>
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                              {post.status === 'published' ? 'Live' : 'Concept'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                          <Button variant="ghost" size="icon" onClick={() => setEditingPostId(post.id)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePost(post.id, post.title)}>
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

          <TabsContent value="beers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl">Bieren</CardTitle>
                <Button onClick={() => setShowBeerEditor(true)} size="sm" className="gap-1.5">
                  <Plus size={14} /> Nieuw bier
                </Button>
              </CardHeader>
              <CardContent>
                {loadingBeers ? <p className="text-center py-6 text-muted-foreground">Laden…</p> : (
                  <div className="divide-y divide-border">
                    {allBeers.map(beer => (
                      <div key={beer.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm truncate">{beer.name}</h3>
                            <Badge variant="secondary" className="text-[10px]">{beer.style}</Badge>
                            <Badge variant={beer.lifecycle_status === 'archive' ? 'outline' : 'default'} className="text-[10px]">
                              {beer.lifecycle_status === 'archive' ? 'Archief' : 'Huidig'}
                            </Badge>
                            {beer.featured && <Badge className="text-[10px]">Featured</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{beer.abv ?? 0}% ABV</span>
                            {beer.brewed_at && <span>· Gebrouwen bij: {beer.brewed_at}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={beer.lifecycle_status === 'archive' ? 'Terug in assortiment' : 'Naar archief'}
                            onClick={() => handleToggleArchive(beer)}
                          >
                            {beer.lifecycle_status === 'archive' ? <RefreshCw size={14} /> : <Archive size={14} />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingBeerId(beer.id)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBeer(beer.id, beer.name)}>
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

          <TabsContent value="featured">
            <Card><CardHeader><CardTitle className="font-serif text-xl">Featured</CardTitle></CardHeader>
              <CardContent><FeaturedManager /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fact-check">
            <Card><CardHeader><CardTitle className="font-serif text-xl">AI Fact-check</CardTitle></CardHeader>
              <CardContent><FactChecker /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-factcheck">
            <Card><CardHeader><CardTitle className="font-serif text-xl">Bulk Fact-check</CardTitle></CardHeader>
              <CardContent><BulkFactCheck /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
