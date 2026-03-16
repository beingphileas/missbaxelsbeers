import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'THE STORIES', path: '/tastings' },
  { label: 'THE MAP', path: '/map' },
  { label: 'BREWERIES', path: '/breweries' },
  { label: 'BEERS', path: '/beers' },
  { label: 'VENUES', path: '/venues' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-foreground">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl tracking-tight">
            MISSBAXEL<span className="text-accent">'S</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-1.5 text-[12px] font-bold tracking-wide border-l-2 border-foreground transition-colors ${
                pathname === item.path
                  ? 'bg-foreground text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
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
          className="md:hidden h-9 w-9 border-2 border-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t-2 border-foreground bg-background px-4 py-2">
          <Link
            to="/"
            className={`block px-3 py-3 text-sm font-bold border-b border-border ${
              pathname === '/' ? 'text-accent' : 'text-foreground'
            }`}
          >
            HOME
          </Link>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-3 text-sm font-bold border-b border-border ${
                pathname === item.path ? 'bg-foreground text-primary-foreground' : 'text-foreground'
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
