import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-[1200px] mx-auto px-5 pt-12 pb-8 grid gap-10 md:grid-cols-5">
        {/* Logo + tagline + socials */}
        <div className="md:col-span-2">
          <Link to="/" className="inline-block mb-3">
            <span
              className="text-2xl text-foreground"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, letterSpacing: '-0.02em' }}
            >
              Miss
              <span style={{ fontStyle: 'italic', fontWeight: 300, color: 'hsl(var(--primary))' }}>Baxel</span>
              <span style={{ fontWeight: 900 }}>'s</span>
            </span>
          </Link>
          <p
            className="text-muted-foreground max-w-sm mb-5"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
          >
            {t('Ik kies de smaak. Zij brouwen het.')}
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://instagram.com/missbaxelsbeers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-primary-light"
              style={{ color: 'hsl(var(--primary))' }}
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://facebook.com/missbaxelsbeers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-primary-light"
              style={{ color: 'hsl(var(--primary))' }}
            >
              <Facebook size={16} />
            </a>
          </div>
        </div>

        {/* Verkennen */}
        <div>
          <h3
            className="mb-4 text-muted-foreground"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('Verkennen')}
          </h3>
          <ul className="space-y-2.5">
            {[
              { to: '/over', label: t('Over') },
              { to: '/beers', label: t('Bieren') },
              { to: '/verhalen', label: t('Verhalen') },
              { to: '/restaurant', label: t('Restaurant') },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground transition-colors no-underline hover:text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* MissBaxel's */}
        <div>
          <h3
            className="mb-4 text-muted-foreground"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            MissBaxel's
          </h3>
          <ul className="space-y-2.5">
            {[
              { to: '/verhaal', label: t('Het verhaal') },
              { to: '/over', label: t('Over mezelf') },
              { to: '/restaurant', label: t('Restaurant') },
              { to: '/bierstekers', label: t('Bierstekers') },
              { to: '/archief', label: t('Archief') },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground transition-colors no-underline hover:text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Juridisch */}
        <div>
          <h3
            className="mb-4 text-muted-foreground"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('Juridisch')}
          </h3>
          <ul className="space-y-2.5">
            {[
              { to: '/privacy', label: t('Privacybeleid') },
              { to: '/algemene-voorwaarden', label: t('Algemene voorwaarden') },
              { to: '/cookiebeleid', label: t('Cookiebeleid') },
              { to: '/verantwoord-drinken', label: t('Verantwoord drinken') },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground transition-colors no-underline hover:text-primary"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div
          className="max-w-[1200px] mx-auto px-5 py-4 flex flex-col gap-2 text-muted-foreground"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px' }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span>© {year} MissBaxel's Beers · Bij Koen &amp; Marijke · Brugge</span>
              <a href="/llms.txt" className="text-muted text-[10px] hover:underline">llms.txt</a>
            </div>
            <div className="flex items-center gap-3">
              <span>Geniet, maar drink met mate. 18+.</span>
              <span style={{ color: 'hsl(var(--tertiary))', fontWeight: 600 }}>Bierstekers</span>
            </div>
          </div>
          <div className="text-center md:text-left text-muted-foreground/80" style={{ fontSize: '10.5px' }}>
            <span className="placeholder-inline">[BEDRIJFSNAAM]</span> ·{' '}
            <span className="placeholder-inline">[ADRES]</span> · BTW{' '}
            <span className="placeholder-inline">[BTW-NUMMER]</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
