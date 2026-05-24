import { useState, useEffect } from 'react';

const STORAGE_KEY = 'missbaxels_age_verified';

export default function AgeGate() {
  const [visible, setVisible] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY);
    if (!verified) {
      setVisible(true);
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleNo = () => {
    setDenied(true);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'hsl(18 43% 29% / 0.92)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="mx-5 max-w-md w-full text-center"
        style={{
          background: 'hsl(var(--cream))',
          borderRadius: 'var(--radius-card)',
          padding: '48px 36px',
          boxShadow: '0 24px 64px hsl(18 43% 15% / 0.4)',
        }}
      >
        {/* Wordmark */}
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 900,
            letterSpacing: '-0.02em',
            fontSize: '28px',
            color: 'hsl(var(--tertiary))',
            lineHeight: 1.1,
          }}
        >
          Miss
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'hsl(var(--primary))' }}>Baxel</span>
          <span style={{ fontWeight: 900 }}>&rsquo;s</span>{' '}
          <span style={{ fontWeight: 300 }}>Beers</span>
        </h1>

        {denied ? (
          <>
            <p
              className="mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.6,
              }}
            >
              Deze website bevat inhoud over alcohol en is uitsluitend bestemd voor volwassenen van 18 jaar of ouder.
            </p>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Kom later terug wanneer je 18 bent.
            </div>
          </>
        ) : (
          <>
            <p
              className="mb-8"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: '20px',
                fontWeight: 500,
                color: 'hsl(var(--tertiary))',
                lineHeight: 1.4,
              }}
            >
              Ben je 18 jaar of ouder?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleYes}
                className="w-full py-3.5 transition-colors hover:opacity-90"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                Ja, ik ben 18+
              </button>
              <button
                onClick={handleNo}
                className="w-full py-3.5 transition-colors hover:opacity-90"
                style={{
                  background: 'transparent',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1.5px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                Nee
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
