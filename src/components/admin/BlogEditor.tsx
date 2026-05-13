import { useEffect, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Send, Sparkles } from 'lucide-react';
import ImageUpload, { uploadInlineImage } from './ImageUpload';
import BlogAssistantPanel from './BlogAssistantPanel';

interface BlogEditorProps {
  postId: string | null;
  onClose: () => void;
}

export default function BlogEditor({ postId, onClose }: BlogEditorProps) {
  const [beers, setBeers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [beerId, setBeerId] = useState<string>('');
  const [selectedBeerIds, setSelectedBeerIds] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load post if editing
  useEffect(() => {
    if (postId) {
      Promise.all([
        supabase.from('blog_posts').select('*').eq('id', postId).single(),
        supabase.from('blog_post_beers').select('beer_id').eq('blog_post_id', postId),
      ]).then(([{ data }, { data: links }]) => {
        if (data) {
          setTitle(data.title);
          setSlug(data.slug);
          setExcerpt(data.excerpt ?? '');
          setContent(data.content);
          setCoverImageUrl(data.cover_image_url ?? '');
          setBeerId(data.beer_id ?? '');
          setSelectedBeerIds((links ?? []).map((l: any) => l.beer_id));
          setTags((data.tags ?? []).join(', '));
          setStatus(data.status);
        }
      });
    }
  }, [postId]);

  // Load all beers (no brewery filter — single-brand site)
  useEffect(() => {
    supabase.from('beers').select('id, name').order('name').then(({ data }) => setBeers(data ?? []));
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 80)
      );
    }
  }, [title, postId]);

  const handleSave = async (publishNow = false) => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Vul titel en content in', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const finalStatus = publishNow ? 'published' : status;
    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content,
      cover_image_url: coverImageUrl.trim() || null,
      beer_id: beerId || null,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      status: finalStatus,
      published_at:
        finalStatus === 'published' ? new Date().toISOString() : null,
    };

    let error;
    let savedPostId = postId;
    if (postId) {
      ({ error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', postId));
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select('id')
        .single();
      error = insertErr;
      savedPostId = inserted?.id ?? null;
    }

    // Sync junction table
    if (!error && savedPostId && selectedBeerIds.length > 0) {
      await supabase.from('blog_post_beers').delete().eq('blog_post_id', savedPostId);
      const links = selectedBeerIds.map(bid => ({ blog_post_id: savedPostId!, beer_id: bid }));
      await supabase.from('blog_post_beers').insert(links);
    } else if (!error && savedPostId) {
      await supabase.from('blog_post_beers').delete().eq('blog_post_id', savedPostId);
    }

    if (error) {
      toast({
        title: 'Fout bij opslaan',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: publishNow
          ? 'Post gepubliceerd!'
          : postId
            ? 'Post bijgewerkt'
            : 'Concept opgeslagen',
      });
      onClose();
    }
    setSaving(false);
  };

  const insertDraft = (markdown: string) => {
    setContent(markdown);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div
        className={`mx-auto px-4 py-6 ${
          assistantOpen ? 'max-w-[1400px] lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6' : 'max-w-4xl'
        }`}
      >
        <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <ArrowLeft size={16} /> Terug
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={assistantOpen ? 'default' : 'outline'}
              onClick={() => setAssistantOpen(o => !o)}
              className="gap-1.5"
            >
              <Sparkles size={14} />
              Assistent
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="gap-1.5"
            >
              <Save size={14} />
              {status === 'draft' ? 'Concept opslaan' : 'Bijwerken'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="gap-1.5"
            >
              <Send size={14} />
              Publiceren
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4 mb-6">
          <div>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titel van je post..."
              className="font-serif text-2xl h-14 border-none shadow-none px-0 focus-visible:ring-0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="post-url-slug" />
            </div>
            <div className="space-y-1.5">
              <ImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Samenvatting</Label>
            <Textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Korte samenvatting..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bieren (meerdere selecteerbaar)</Label>
              <div className="border border-input rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {beers.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 px-1 py-0.5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBeerIds.includes(b.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedBeerIds(prev => [...prev, b.id]);
                          if (!beerId) setBeerId(b.id);
                        } else {
                          setSelectedBeerIds(prev => prev.filter(id => id !== b.id));
                        }
                      }}
                      className="accent-[hsl(var(--accent))]"
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tags (komma-gescheiden)</Label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="trappist, tasting, ..."
              />
            </div>
          </div>
        </div>

        {/* Markdown Editor with inline image paste/drop */}
        <div
          data-color-mode="light"
          className="border rounded-lg overflow-hidden"
          onPaste={async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
              if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) return;
                const url = await uploadInlineImage(file);
                if (url) setContent(prev => prev + `\n![](${url})\n`);
                return;
              }
            }
          }}
          onDrop={async (e) => {
            const file = e.dataTransfer?.files[0];
            if (file?.type.startsWith('image/')) {
              e.preventDefault();
              const url = await uploadInlineImage(file);
              if (url) setContent(prev => prev + `\n![](${url})\n`);
            }
          }}
          onDragOver={(e) => {
            if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
          }}
        >
          <MDEditor
            value={content}
            onChange={val => setContent(val ?? '')}
            height={500}
            preview="live"
          />
        </div>
        </div>

        {/* Desktop side panel */}
        {assistantOpen && (
          <aside className="hidden lg:block">
            <div className="sticky top-6 h-[calc(100vh-6rem)] border border-border rounded-lg overflow-hidden">
              <BlogAssistantPanel
                title={title}
                onClose={() => setAssistantOpen(false)}
                onDraft={insertDraft}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile bottom drawer */}
      {!isDesktop && (
        <Drawer open={assistantOpen} onOpenChange={setAssistantOpen}>
          <DrawerContent className="h-[85vh] p-0">
            <BlogAssistantPanel
              title={title}
              onClose={() => setAssistantOpen(false)}
              onDraft={insertDraft}
            />
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
