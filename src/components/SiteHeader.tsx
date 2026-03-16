import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Stories', path: '/tastings' },
  { label: 'Map', path: '/map' },
  { label: 'Breweries', path: '/breweries' },
  { label: 'Beers', path: '/beers' },
  { label: 'Venues', path: '/venues' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
              {item.label}
            </Link>
          ))}
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
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
