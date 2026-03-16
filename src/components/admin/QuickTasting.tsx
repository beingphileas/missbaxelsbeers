import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Send, Loader2, Wine } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface QuickTastingProps {
  onPublished: () => void;
}

export default function QuickTasting({ onPublished }: QuickTastingProps) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: 'Schrijf eerst je tasting notitie', variant: 'destructive' });
      return;
    }

    setPublishing(true);

    // Auto-generate title from first line/sentence
    const firstLine = trimmed.split(/[\n.!?]/)[0].trim().slice(0, 80);
    const title = firstLine || 'Tasting';

    // Auto-generate slug
    const slug =
      'tasting-' +
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) +
      '-' +
      Date.now().toString(36);

    // Build markdown content
    let content = trimmed;
    if (imageUrl) {
      content = `![Tasting foto](${imageUrl})\n\n${trimmed}`;
    }

    const { error } = await supabase.from('blog_posts').insert({
      title,
      slug,
      content,
      cover_image_url: imageUrl || null,
      excerpt: trimmed.slice(0, 160),
      tags: ['tasting'],
      status: 'published',
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: 'Fout bij publiceren', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tasting gepubliceerd! 🍺' });
      setText('');
      setImageUrl('');
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
          Typ je tasting notitie en publiceer direct — titel, slug en tags worden automatisch gegenereerd.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Vandaag geproefd: een prachtige tripel van..."
          rows={5}
          className="resize-none"
        />

        <ImageUpload value={imageUrl} onChange={setImageUrl} label="Foto (optioneel)" />

        <div className="flex justify-end">
          <Button
            onClick={handlePublish}
            disabled={publishing || !text.trim()}
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
      </CardContent>
    </Card>
  );
}
