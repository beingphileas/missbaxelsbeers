import { ReactNode } from 'react';
import SEOHead from '@/components/SEOHead';

interface Props {
  title: string;
  description: string;
  url: string;
  updated?: string;
  children: ReactNode;
}

/**
 * Shared layout for legal pages. Wine-cellar styling, Fraunces headings,
 * DM Sans body. Indexeerbaar (geen noindex).
 */
export default function LegalLayout({ title, description, url, updated, children }: Props) {
  return (
    <>
      <SEOHead title={title} description={description} url={url} />
      <article className="max-w-[800px] mx-auto px-5 py-16 md:py-24">
        <header className="mb-10 pb-8 border-b border-border">
          <h1
            className="text-foreground mb-3"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 900,
              letterSpacing: '-0.02em',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {updated && (
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}
            >
              Laatst bijgewerkt: {updated}
            </p>
          )}
        </header>
        <div
          className="legal-prose text-foreground"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', lineHeight: 1.7 }}
        >
          {children}
        </div>
      </article>
      <style>{`
        .legal-prose h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: -0.01em;
          margin: 2.5rem 0 1rem;
          color: hsl(var(--foreground));
        }
        .legal-prose h3 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: 1.15rem;
          margin: 1.75rem 0 .5rem;
        }
        .legal-prose p { margin: 0 0 1rem; }
        .legal-prose ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1rem; }
        .legal-prose li { margin-bottom: .35rem; }
        .legal-prose a { color: hsl(var(--primary)); text-decoration: underline; }
        .legal-prose strong { color: hsl(var(--foreground)); }
        .legal-prose .placeholder {
          background: hsl(var(--primary) / 0.08);
          color: hsl(var(--primary));
          padding: 0 .35rem;
          border-radius: 3px;
          font-weight: 600;
          font-size: .92em;
        }
        .legal-prose .warning {
          background: hsl(var(--tertiary, var(--primary)) / 0.08);
          border-left: 3px solid hsl(var(--primary));
          padding: .85rem 1rem;
          margin: 1.25rem 0;
          border-radius: 4px;
          font-size: .95em;
        }
      `}</style>
    </>
  );
}
