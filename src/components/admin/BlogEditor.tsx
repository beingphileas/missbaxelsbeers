import { useEffect, useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '@/integrations/supabase/client';
import { useBreweries } from '@/data/breweries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Send } from 'lucide-react';
import ImageUpload, { uploadInlineImage } from './ImageUpload';

interface BlogEditorProps {
  postId: string | null;
  onClose: () => void;
}

export default function BlogEditor({ postId, onClose }: BlogEditorProps) {
  const { data: breweries = [] } = useBreweries();
  const [beers, setBeers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [breweryId, setBreweryId] = useState<string>('');
  const [beerId, setBeerId] = useState<string>('');
  const [selectedBeerIds, setSelectedBeerIds] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');

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
          setBreweryId(data.brewery_id ?? '');
          setBeerId(data.beer_id ?? '');
          setSelectedBeerIds((links ?? []).map((l: any) => l.beer_id));
          setTags((data.tags ?? []).join(', '));
          setStatus(data.status);
        }
      });
    }
  }, [postId]);

  // Load beers when brewery changes
  useEffect(() => {
    if (breweryId) {
      supabase
        .from('beers')
        .select('id, name')
        .eq('brewery_id', breweryId)
        .order('name')
        .then(({ data }) => setBeers(data ?? []));
    } else {
      setBeers([]);
      setBeerId('');
    }
  }, [breweryId]);

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
      brewery_id: breweryId || null,
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
    if (postId) {
      ({ error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', postId));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(postData));
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose} className="gap-1.5">
            <ArrowLeft size={16} /> Terug
          </Button>
          <div className="flex gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Brouwerij</Label>
              <Select value={breweryId} onValueChange={setBreweryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies brouwerij" />
                </SelectTrigger>
                <SelectContent>
                  {breweries.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bier</Label>
              <Select value={beerId} onValueChange={setBeerId} disabled={!breweryId}>
                <SelectTrigger>
                  <SelectValue placeholder={breweryId ? 'Kies bier' : 'Kies eerst brouwerij'} />
                </SelectTrigger>
                <SelectContent>
                  {beers.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
