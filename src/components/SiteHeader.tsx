import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, Lang } from '@/hooks/useLanguage';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'A-Z', path: '/beers' },
  { label: 'Over mezelf', path: '/over' },
  { label: 'Waar?', path: '/restaurant' },
  { label: 'Verhalen', path: '/verhalen' },
  { label: 'Bierstekers', path: '/bierstekers' },
];

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'nl', label: 'NL' },
  { value: 'en', label: 'EN' },
];

const SERIF = "'Lora', Georgia, serif";
const SANS = "'Nunito Sans', system-ui, sans-serif";

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang, t, isTranslating } = useLanguage();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(107,58,42,0.12)' }}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">
        {/* Wordmark — left */}
        <Link to="/" className="shrink-0 no-underline" aria-label="MissBaxel's Beers home" style={{ color: 'var(--ink)' }}>
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.01em',
            }}
          >
            Miss<em style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--copper)' }}>Baxel</em>'s Beers
          </span>
        </Link>

        {/* Nav — right */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-end">
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative no-underline transition-colors"
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? 'var(--ink)' : 'rgba(107,58,42,0.7)',
                  paddingBottom: 4,
                  borderBottom: active ? '2px solid var(--amber)' : '2px solid transparent',
                }}
              >
                {t(item.label)}
              </Link>
            );
          })}

          {/* Search icon */}
          <Link
            to="/zoeken"
            aria-label="Search"
            className="no-underline inline-flex items-center"
            style={{ color: 'var(--ink)' }}
          >
            <Search size={16} />
          </Link>

          {/* Language */}
          <div className="inline-flex items-center gap-1" style={{ fontFamily: SANS, fontSize: 11, color: 'rgba(107,58,42,0.6)' }}>
            {isTranslating && <Loader2 size={11} className="animate-spin" />}
            {LANG_OPTIONS.map((opt, i) => (
              <span key={opt.value} className="flex items-center">
                {i > 0 && <span style={{ padding: '0 4px' }}>·</span>}
                <button
                  onClick={() => setLang(opt.value)}
                  disabled={isTranslating}
                  style={{
                    fontWeight: lang === opt.value ? 700 : 400,
                    color: lang === opt.value ? '#111' : '#888',
                  }}
                >
                  {opt.label}
                </button>
              </span>
            ))}
          </div>

          {/* Auth */}
          {user ? (
            <button onClick={signOut} aria-label={t('Uitloggen')} style={{ color: '#888' }}>
              <LogOut size={14} />
            </button>
          ) : (
            <Link to="/login" aria-label={t('Inloggen')} style={{ color: '#888' }}>
              <LogIn size={14} />
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden h-9 w-9 inline-flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          style={{ color: '#111' }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden px-6 py-4 space-y-2" style={{ borderTop: '1px solid #f0f0f0', background: '#fff' }}>
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="block no-underline"
                style={{
                  fontFamily: SANS,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#111',
                  padding: '8px 0',
                  borderBottom: active ? '2px solid #d93025' : '2px solid transparent',
                  display: 'inline-block',
                }}
              >
                {t(item.label)}
              </Link>
            );
          })}

          <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: lang === opt.value ? 700 : 400,
                  color: lang === opt.value ? '#111' : '#888',
                  padding: '4px 8px',
                }}
              >
                {opt.label}
              </button>
            ))}
            {user ? (
              <button onClick={signOut} className="ml-auto" style={{ color: '#888' }}>
                <LogOut size={14} />
              </button>
            ) : (
              <Link to="/login" className="ml-auto" style={{ color: '#888' }}>
                <LogIn size={14} />
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
