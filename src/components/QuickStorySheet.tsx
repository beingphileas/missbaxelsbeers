import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

const EMOJIS = ['🍺', '🍋', '🖤', '🌿', '🍒', '🔥'];
const MAX_IMPRESSION = 280;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickStorySheet({ open, onOpenChange }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [impression, setImpression] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setImpression('');
    setEmoji(EMOJIS[0]);
  };

  const handleSubmit = async () => {
    const title = name.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const slug = `${slugify(title) || 'verhaal'}-${Date.now()}`;
    const { error } = await supabase.from('blog_posts').insert({
      title,
      slug,
      excerpt: impression.trim() || null,
      content: impression.trim() || title,
      image_emoji: emoji,
      status: 'published',
      date: today,
      published_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('Kon verhaal niet publiceren'));
      console.error(error);
      return;
    }
    toast.success(t('Verhaal gepubliceerd ✓'));
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-charcoal/95 border-white/10 text-white">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-serif text-xl text-white">
            {t('Snel verhaal')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          <div>
            <label className="block text-xs text-white/60 mb-1.5">{t('Bier')}</label>
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('Naam van het bier')}
              className="h-12 bg-white/[0.06] border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1.5">
              {t('Indruk')} <span className="text-white/30">({impression.length}/{MAX_IMPRESSION})</span>
            </label>
            <Textarea
              value={impression}
              onChange={e => setImpression(e.target.value.slice(0, MAX_IMPRESSION))}
              placeholder={t('Eén zin die het bier vangt…')}
              rows={2}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">{t('Emoji')}</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-12 w-12 rounded-xl text-2xl flex items-center justify-center transition-all border ${
                    emoji === e
                      ? 'bg-accent/20 border-accent scale-105'
                      : 'bg-white/[0.06] border-white/10 hover:bg-white/10'
                  }`}
                  aria-label={e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-base font-medium"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : t('Publiceer')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
