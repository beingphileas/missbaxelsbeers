import { useEffect, useState, ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Hook die dynamische tekst (bv. uit de database) automatisch vertaalt naar de
 * actieve taal. Retourneert eerst de originele NL-tekst en daarna — zodra de
 * vertaling binnen is — de vertaalde versie. Gebruikt de gedeelde
 * `translateDynamic` batch + localStorage-cache uit `useLanguage`, dus elke
 * unieke string wordt maar één keer ooit vertaald.
 */
export function useT(text: string | null | undefined): string {
  const { lang, translations, translateDynamic } = useLanguage();
  const source = (text ?? '').toString();
  const [out, setOut] = useState<string>(source);

  useEffect(() => {
    if (!source || lang === 'nl') {
      setOut(source);
      return;
    }
    const cached = translations[source];
    if (cached) {
      setOut(cached);
      return;
    }
    setOut(source);
    let cancelled = false;
    translateDynamic(source).then((v) => {
      if (!cancelled) setOut(v);
    });
    return () => {
      cancelled = true;
    };
  }, [source, lang, translations, translateDynamic]);

  return out;
}

/**
 * Wrapper-component: rendert kindtekst (string of children) en vertaalt
 * automatisch. Voor langere DB-velden — gebruik <T>{post.title}</T>.
 */
export function T({ children, as }: { children: ReactNode; as?: 'span' | 'div' | 'p' }) {
  const text = typeof children === 'string' ? children : String(children ?? '');
  const translated = useT(text);
  const Tag = as ?? 'span';
  return <Tag>{translated}</Tag>;
}

export default T;
