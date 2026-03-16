import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBlogPosts } from '@/data/blog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye, MapPin, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BlogEditor from '@/components/admin/BlogEditor';
import VenueEditor from '@/components/admin/VenueEditor';
import CoordFixer from '@/components/admin/CoordFixer';
import { useQueryClient } from '@tanstack/react-query';

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: posts = [], isLoading } = useBlogPosts();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [showVenueEditor, setShowVenueEditor] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Blog posts
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Venues
  const [allVenues, setAllVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

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
        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Blog Posts</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
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
                              <Badge variant="default" className="shrink-0 text-[10px] gap-0.5">
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

          {/* Coords Tab */}
          <TabsContent value="coords">
            <CoordFixer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
