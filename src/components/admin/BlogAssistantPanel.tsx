import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, RotateCcw, PencilLine, Loader2, Send, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

interface Props {
  title: string;
  rubric?: string;
  enrichment?: Record<string, { value: any; source: string }>;
  onClose: () => void;
  onDraft: (markdown: string) => void;
}

const INTRO: Msg = {
  role: 'assistant',
  content: 'Ik help je het verhaal opbouwen. Eerst een paar korte vragen — daarna schrijf ik de eerste versie.',
};

export default function BlogAssistantPanel({ title, rubric, enrichment, onClose, onDraft }: Props) {
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [phase, setPhase] = useState<'interview' | 'done'>('interview');
  const scrollRef = useRef<HTMLDivElement>(null);
  const askedFirstRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, drafting]);

  // Kick off the first question once
  useEffect(() => {
    if (askedFirstRef.current) return;
    askedFirstRef.current = true;
    askNext([INTRO]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askNext = async (history: Msg[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-assistant', {
        body: { mode: 'interview', rubric, title, messages: history.filter(m => m !== INTRO) },
      });
      if (error) throw error;
      const text: string = data?.content ?? '';
      const ready: boolean = Boolean(data?.ready);
      if (ready || !text) {
        setPhase('done');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Genoeg om mee te starten — ik schrijf nu de eerste versie.' }]);
        await runDraft([...history]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      }
    } catch (e: any) {
      toast({ title: 'Assistent fout', description: e.message ?? 'Onbekende fout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const runDraft = async (history: Msg[]) => {
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-assistant', {
        body: { mode: 'draft', rubric, title, messages: history.filter(m => m !== INTRO) },
      });
      if (error) throw error;
      const draft: string = (data?.content ?? '').trim();
      if (!draft) throw new Error('Lege draft ontvangen');
      onDraft(draft);
      toast({ title: 'Eerste versie klaar — pas gerust aan ✓' });
      setPhase('done');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Klaar — de eerste versie staat in de editor. Je kan opnieuw starten of verder schrijven.' }]);
    } catch (e: any) {
      toast({ title: 'Draft mislukt', description: e.message ?? 'Onbekende fout', variant: 'destructive' });
    } finally {
      setDrafting(false);
    }
  };

  const sendAnswer = async () => {
    const text = input.trim();
    if (!text || loading || drafting) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    if (phase === 'interview') {
      await askNext(next);
    }
  };

  const writeNow = async () => {
    if (loading || drafting) return;
    setPhase('done');
    await runDraft(messages);
  };

  const reset = () => {
    if (loading || drafting) return;
    setMessages([INTRO]);
    setInput('');
    setPhase('interview');
    askedFirstRef.current = false;
    setTimeout(() => {
      askedFirstRef.current = true;
      askNext([INTRO]);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="font-semibold text-sm">Schrijfassistent</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Sluit">
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {(loading || drafting) && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {drafting ? 'Eerste versie aan het schrijven…' : 'Even nadenken…'}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 py-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={writeNow} disabled={loading || drafting} className="gap-1.5">
          <PencilLine size={13} /> Schrijf nu
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={loading || drafting} className="gap-1.5">
          <RotateCcw size={13} /> Opnieuw
        </Button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); sendAnswer(); }}
        className="border-t border-border px-3 py-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={phase === 'interview' ? 'Jouw antwoord…' : 'Geef extra context…'}
          disabled={loading || drafting}
          className="text-base sm:text-sm"
        />
        <Button type="submit" size="icon" disabled={loading || drafting || !input.trim()} className="shrink-0">
          {loading || drafting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </form>
    </div>
  );
}
