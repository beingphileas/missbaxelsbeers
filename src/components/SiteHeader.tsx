import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, Lang } from '@/hooks/useLanguage';

const navItems = [
  { label: 'Bieren', path: '/beers' },
  { label: 'Verhalen', path: '/verhalen' },
  { label: 'Restaurant', path: '/restaurant' },
  { label: 'Bierstekers archief', path: '/bierstekers' },
  { label: 'Over', path: '/over' },
  { label: 'Archief', path: '/archief' },
];

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'nl', label: 'NL' },
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang, t, isTranslating } = useLanguage();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between gap-4">
        {/* Logo — left */}
        <Link to="/" className="flex items-center shrink-0 group" aria-label="MissBaxel's home">
          <span className="font-display text-xl leading-none text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
            Miss<span className="font-italic-accent text-primary" style={{ fontWeight: 300 }}>Baxel</span>
            <span style={{ fontWeight: 900 }}>'s</span>
          </span>
        </Link>

        {/* Nav — center */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-[14px] py-[6px] text-[12px] font-medium tracking-wide rounded-full transition-colors no-underline ${
                  active
                    ? 'bg-[hsl(var(--primary-light))] text-primary'
                    : 'text-muted-foreground hover:bg-[hsl(var(--primary-light))] hover:text-primary'
                }`}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        {/* Right — language + CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Language pill */}
          <div className="inline-flex items-center gap-0.5 border border-border rounded-full px-1 py-0.5 bg-card">
            {isTranslating && <Loader2 size={11} className="animate-spin text-primary mx-1" />}
            {LANG_OPTIONS.map((opt, i) => (
              <span key={opt.value} className="flex items-center">
                {i > 0 && <span className="text-muted-foreground/50 text-[10px] px-0.5">·</span>}
                <button
                  onClick={() => setLang(opt.value)}
                  disabled={isTranslating}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors ${
                    lang === opt.value
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              </span>
            ))}
          </div>

          {/* Bierstekers CTA */}
          <Link
            to="/restaurant"
            className="inline-flex items-center gap-1.5 bg-[var(--copper)] text-white rounded-full px-4 py-[7px] text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            {t('Reserveer een tafel')}
            <ArrowRight size={13} />
          </Link>

          {/* Auth */}
          {user ? (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] font-medium px-2 py-1 transition-colors"
              aria-label={t('Uitloggen')}
            >
              <LogOut size={13} />
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] font-medium px-2 py-1 transition-colors"
              aria-label={t('Inloggen')}
            >
              <LogIn size={13} />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-border text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-background px-5 py-3 space-y-1">
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  active
                    ? 'bg-[hsl(var(--primary-light))] text-primary'
                    : 'text-muted-foreground hover:bg-[hsl(var(--primary-light))] hover:text-primary'
                }`}
              >
                {t(item.label)}
              </Link>
            );
          })}

          <div className="flex items-center gap-1 pt-2 mt-2 border-t border-border">
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
                  lang === opt.value
                    ? 'bg-[hsl(var(--primary-light))] text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Link
            to="/restaurant"
            className="mt-3 inline-flex items-center gap-1.5 bg-[var(--copper)] text-white rounded-full px-4 py-2 text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            {t('Reserveer een tafel')} <ArrowRight size={13} />
          </Link>

          {user ? (
            <button onClick={signOut} className="block w-full text-left px-4 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground">
              {t('Uitloggen')}
            </button>
          ) : (
            <Link to="/login" className="block px-4 py-2 text-sm font-medium rounded-full text-primary">
              {t('Inloggen')}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
