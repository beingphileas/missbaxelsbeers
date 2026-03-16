import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Send, Loader2, Wine, Sparkles } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface QuickTastingProps {
  onPublished: () => void;
}

export default function QuickTasting({ onPublished }: QuickTastingProps) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState<{
    content: string;
    title: string;
    excerpt: string;
    tags: string[];
  } | null>(null);

  const handleFormat = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: 'Schrijf eerst je tasting notitie', variant: 'destructive' });
      return;
    }

    setPublishing(true);
    setPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke('format-tasting', {
        body: { text: trimmed, imageUrl: imageUrl || null },
      });

      if (error) throw error;

      setPreview({
        content: data.content,
        title: data.title,
        excerpt: data.excerpt,
        tags: data.tags,
      });
    } catch (err: any) {
      toast({ title: 'Fout bij formatteren', description: err.message, variant: 'destructive' });
    }
    setPublishing(false);
  };

  const handlePublish = async () => {
    if (!preview) return;

    setPublishing(true);

    const slug =
      'tasting-' +
      preview.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) +
      '-' +
      Date.now().toString(36);

    const { error } = await supabase.from('blog_posts').insert({
      title: preview.title,
      slug,
      content: preview.content,
      cover_image_url: imageUrl || null,
      excerpt: preview.excerpt,
      tags: preview.tags,
      status: 'published',
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: 'Fout bij publiceren', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tasting gepubliceerd! 🍺' });
      setText('');
      setImageUrl('');
      setPreview(null);
      onPublished();
    }
    setPublishing(false);
  };

  return (
    <Card className="shadow-card border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Wine size={18} className="text-accent" />
          Snelle Tasting
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Typ je tasting notitie — AI formatteert het automatisch als blogpost met Tasting Notes, titel, excerpt en tags.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Vandaag geproefd: een prachtige tripel van Brouwerij X uit Gent. Goudgeel, volle schuimkraag. Ruikt naar citrus en honing. Smaak is mooi gebalanceerd met een bittere afdronk..."
              rows={6}
              className="resize-none"
            />

            <ImageUpload value={imageUrl} onChange={setImageUrl} label="Foto (optioneel)" />

            <div className="flex justify-end">
              <Button
                onClick={handleFormat}
                disabled={publishing || !text.trim()}
                className="gap-1.5"
              >
                {publishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Analyseer & formatteer
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Titel</p>
                <p className="font-serif text-lg font-medium">{preview.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Excerpt</p>
                <p className="text-sm text-muted-foreground">{preview.excerpt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {preview.tags.map(tag => (
                    <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Inhoud (preview)</p>
                <div className="max-h-64 overflow-y-auto bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">
                  {preview.content}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setPreview(null)}
                disabled={publishing}
              >
                Terug bewerken
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="gap-1.5"
              >
                {publishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Publiceer tasting
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
