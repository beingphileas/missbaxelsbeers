import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';

export type Lang = 'nl' | 'en' | 'fr';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: string) => string;
  translateDynamic: (text: string) => Promise<string>;
  translations: Record<string, string>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'nl',
  setLang: () => {},
  t: (text) => text,
  translateDynamic: async (text) => text,
  translations: {},
  isTranslating: false,
});

const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
const CACHE_PREFIX = 'bw_translations_';

function loadCache(lang: Lang): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: Lang, cache: Record<string, string>) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(cache));
  } catch {
    // localStorage full, ignore
  }
}

async function fetchTranslations(texts: string[], targetLang: Lang): Promise<Record<string, string>> {
  const resp = await fetch(TRANSLATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ texts, target_lang: targetLang }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Vertaling mislukt (${resp.status})`);
  }

  const data = await resp.json();
  return data.translations || {};
}

// Collect all registered UI strings
const registeredStrings = new Set<string>();

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('nl');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLang = useCallback(async (newLang: Lang) => {
    setLangState(newLang);

    if (newLang === 'nl') {
      setTranslations({});
      return;
    }

    // Load cache first
    const cached = loadCache(newLang);
    setTranslations(cached);

    // Find strings that need translation
    const allStrings = Array.from(registeredStrings);
    const missing = allStrings.filter(s => !cached[s] && s.trim().length > 0);

    if (missing.length === 0) return;

    setIsTranslating(true);
    try {
      // Batch in chunks of 50
      const chunks: string[][] = [];
      for (let i = 0; i < missing.length; i += 50) {
        chunks.push(missing.slice(i, i + 50));
      }

      let allNew: Record<string, string> = {};
      for (const chunk of chunks) {
        const result = await fetchTranslations(chunk, newLang);
        allNew = { ...allNew, ...result };
      }

      const merged = { ...cached, ...allNew };
      setTranslations(merged);
      saveCache(newLang, merged);
    } catch (e: any) {
      console.error('Translation error:', e);
      toast.error(e.message || 'Vertaling mislukt');
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const t = useCallback((text: string): string => {
    if (!text) return text;
    registeredStrings.add(text);

    if (lang === 'nl') return text;
    return translations[text] || text;
  }, [lang, translations]);

  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    if (!text || lang === 'nl') return text;

    // Check cache
    const cached = translations[text];
    if (cached) return cached;

    // Batch dynamic translations
    pendingRef.current.add(text);

    return new Promise((resolve) => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);

      batchTimerRef.current = setTimeout(async () => {
        const batch = Array.from(pendingRef.current);
        pendingRef.current.clear();

        try {
          const result = await fetchTranslations(batch, lang);
          setTranslations(prev => {
            const merged = { ...prev, ...result };
            saveCache(lang, merged);
            return merged;
          });
          resolve(result[text] || text);
        } catch {
          resolve(text);
        }
      }, 100);
    });
  }, [lang, translations]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, translateDynamic, translations, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
