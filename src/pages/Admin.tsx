import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBlogPosts } from '@/data/blog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BlogEditor from '@/components/admin/BlogEditor';
import { useQueryClient } from '@tanstack/react-query';

export default function Admin() {
  const { user, signOut } = useAuth();
  const { data: posts = [], isLoading } = useBlogPosts();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch ALL posts (including drafts) for admin
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useState(() => {
    supabase
      .from('blog_posts')
      .select('*, breweries:brewery_id(name), beers:beer_id(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAllPosts(data ?? []);
        setLoadingAll(false);
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return;

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout bij verwijderen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post verwijderd' });
      refreshPosts();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (showEditor || editingPostId) {
    return (
      <BlogEditor
        postId={editingPostId}
        onClose={() => {
          setShowEditor(false);
          setEditingPostId(null);
          refreshPosts();
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
          <div className="flex gap-2">
            <Button onClick={() => setShowEditor(true)} className="gap-1.5">
              <Plus size={16} />
              Nieuwe Post
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
              <p className="font-serif text-3xl text-accent">{allPosts.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Totaal</p>
            </CardContent>
          </Card>
        </div>

        {/* Posts list */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAll ? (
              <p className="text-muted-foreground py-8 text-center">Laden...</p>
            ) : allPosts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Nog geen posts. Maak je eerste blog post!</p>
                <Button onClick={() => setShowEditor(true)} className="gap-1.5">
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
                          <Link to={`/post/${post.slug}`}>
                            <Eye size={14} />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setEditingPostId(post.id)}>
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post.id, post.title)}
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
      </div>
    </div>
  );
}
