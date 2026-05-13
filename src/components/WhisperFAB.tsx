import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/hooks/useLanguage';
import { ASK_EVENT } from '@/lib/askMissBaxel';
import QuickStorySheet from './QuickStorySheet';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-whisperer`;

export default function WhisperFAB() {
  const [open, setOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const SUGGESTIONS = [
    t("Welk MissBaxel's bier past bij gegrild vlees?"),
    t("Vertel me over de samenwerking met Alvinne"),
    t("Wat maakt Bij Koen & Marijke uniek in Brugge?"),
    t("Welke brouwerijen werken samen met MissBaxel's?"),
  ];

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [answer]);

  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<{ query: string }>).detail?.query?.trim();
      if (!q) return;
      setOpen(true);
      setQuery(q);
      handleAsk(q);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAsk = useCallback(async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer('');
    setError('');

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query: q.trim() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setError(errData.error || `${t('Fout')} (${resp.status})`);
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setError(t('Geen antwoord ontvangen'));
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnswer(fullText);
            }
          } catch {
            // partial JSON, ignore
          }
        }
      }
    } catch (e) {
      console.error('Whisperer error:', e);
      setError(t('Kon de Whisperer niet bereiken. Probeer het opnieuw.'));
    } finally {
      setLoading(false);
    }
  }, [loading, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(query);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    handleAsk(s);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
          >
            <button
              onClick={() => setStoryOpen(true)}
              className="w-12 h-12 rounded-full bg-charcoal/90 text-white border border-white/15 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              aria-label={t('Snel verhaal')}
              title={t('Snel verhaal')}
            >
              <PenLine size={18} />
            </button>
            <button
              onClick={() => setOpen(true)}
              className="w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(218,165,32,0.4)] hover:shadow-[0_6px_28px_rgba(218,165,32,0.55)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              aria-label={t('Stel een biervraag')}
            >
              <Sparkles size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-md rounded-2xl border border-white/15 backdrop-blur-2xl bg-charcoal/90 shadow-[0_16px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[70vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Sparkles size={16} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-semibold">{t("Vraag MissBaxel's")}</h3>
                    <p className="text-white/40 text-[10px]">{t('Jouw persoonlijke biergids')}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 min-h-[200px]">
                {!answer && !loading && !error && (
                  <div className="space-y-3">
                    <p className="text-white/50 text-sm mb-4">{t("Stel me een vraag over de bieren van MissBaxel's, de brouwers of bier-spijs combinaties...")}</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          className="text-[11px] text-white/60 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 rounded-full transition-colors text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">{error}</div>
                )}

                {(answer || loading) && (
                  <div className="prose prose-sm prose-invert max-w-none [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline [&_p]:text-white/80 [&_li]:text-white/80 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white">
                    <ReactMarkdown>{answer}</ReactMarkdown>
                    {loading && <span className="inline-block w-1.5 h-4 bg-accent/70 animate-pulse ml-0.5" />}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("Vraag iets over MissBaxel's bieren...")}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/40 transition-colors"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !query.trim()} className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg h-10 w-10">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuickStorySheet open={storyOpen} onOpenChange={setStoryOpen} />
    </>
  );
}
