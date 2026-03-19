import { useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';

/**
 * Hook that translates a dynamic string using the shared translation cache.
 * Returns the cached translation instantly if available, otherwise fetches it.
 */
export function useTranslatedText(text: string): string {
  const { lang, translations, translateDynamic } = useLanguage();
  const [translated, setTranslated] = useState(lang === 'nl' ? text : (translations[text] || text));

  useEffect(() => {
    if (!text || lang === 'nl') {
      setTranslated(text);
      return;
    }

    // Use cached value immediately if available
    if (translations[text]) {
      setTranslated(translations[text]);
      return;
    }

    let cancelled = false;
    translateDynamic(text).then(result => {
      if (!cancelled) setTranslated(result);
    });
    return () => { cancelled = true; };
  }, [text, lang, translations, translateDynamic]);

  return translated;
}
