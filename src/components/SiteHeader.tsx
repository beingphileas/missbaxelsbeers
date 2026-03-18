import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, Lang } from '@/hooks/useLanguage';

const navItems = [
  { label: 'Verhalen', path: '/tastings' },
  { label: 'Kaart', path: '/map' },
  { label: 'Brouwerijen', path: '/breweries' },
  { label: 'Bieren', path: '/beers' },
  { label: 'Venues', path: '/venues' },
];

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'nl', label: 'NL', flag: '🇳🇱' },
  { value: 'en', label: 'EN', flag: '🇬🇧' },
  { value: 'fr', label: 'FR', flag: '🇫🇷' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang, t, isTranslating } = useLanguage();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gebruiker';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/95 backdrop-blur-md shadow-vintage border-b border-border/60' 
        : 'bg-background border-b border-border/40'
    }`}>
      <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl tracking-tight">
            MissBaxel<span className="text-accent font-light">'s</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 text-[12px] font-medium tracking-wide rounded-md transition-all duration-200 ${
                pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
              }`}
            >
              {t(item.label)}
            </Link>
          ))}

          {/* Language switcher */}
          <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-border/40">
            {isTranslating && <Loader2 size={12} className="animate-spin text-accent mr-1" />}
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                disabled={isTranslating}
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                  lang === opt.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {opt.flag} {opt.label}
              </button>
            ))}
          </div>

          {/* Auth button */}
          {user ? (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border/40">
              <span className="text-xs text-muted-foreground">{t('Welkom')}, <span className="font-medium text-foreground">{displayName}</span></span>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={signOut}>
                <LogOut size={14} /> {t('Uitloggen')}
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm" className="ml-3 h-8 gap-1.5 text-xs">
              <Link to="/login"><LogIn size={14} /> {t('Inloggen')}</Link>
            </Button>
          )}
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-md px-5 py-3 space-y-1">
          {/* Language switcher mobile */}
          <div className="flex items-center gap-1 px-4 py-2 mb-2">
            {isTranslating && <Loader2 size={12} className="animate-spin text-accent mr-1" />}
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                disabled={isTranslating}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${
                  lang === opt.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {opt.flag} {opt.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/' ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-secondary'
            }`}
          >
            Home
          </Link>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.path ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-secondary'
              }`}
            >
              {t(item.label)}
            </Link>
          ))}

          {/* Mobile auth */}
          {user ? (
            <div className="pt-2 mt-2 border-t border-border/40 space-y-2">
              <p className="px-4 text-xs text-muted-foreground">{t('Welkom')}, <span className="font-medium text-foreground">{displayName}</span></p>
              <button
                onClick={signOut}
                className="block w-full text-left px-4 py-3 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                {t('Uitloggen')}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block px-4 py-3 text-sm font-medium rounded-lg text-accent hover:bg-accent/10 transition-colors"
            >
              {t('Inloggen')}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
