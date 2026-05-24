import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const STORAGE_KEY = 'cookie-consent.v1';

/**
 * Cookie-consent banner.
 *
 * Huidige modus: de site gebruikt cookieloze statistieken, dus deze banner is
 * puur informatief — geen verplichte opt-in. Toekomstige uitbreiding (zodra
 * een betaalprovider cookies plaatst) is voorzien via het consent-object met
 * categorieën `necessary` en `functional`.
 */
type ConsentValue = {
  acknowledged: true;
  date: string;
  // Voor toekomstige uitbreiding:
  categories?: { necessary: true; functional: boolean };
};

export function readConsent(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentValue) : null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          acknowledged: true,
          date: new Date().toISOString(),
          categories: { necessary: true, functional: false },
        } satisfies ConsentValue),
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-melding"
      className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-[60] rounded-lg border border-border bg-card shadow-lg"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="p-4 pr-10 text-sm text-foreground">
        <p style={{ lineHeight: 1.55 }}>
          We gebruiken <strong>cookieloze, geanonimiseerde statistieken</strong> om te zien welke
          verhalen gelezen worden. Geen tracking, geen advertenties.{' '}
          <Link
            to="/cookiebeleid"
            className="underline"
            style={{ color: 'hsl(var(--primary))' }}
          >
            Meer lezen
          </Link>
          .
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground, var(--background)))',
            }}
          >
            Begrepen
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Sluiten"
        onClick={accept}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
