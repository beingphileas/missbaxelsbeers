import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Tastings', path: '/tastings' },
  { label: 'Brouwerijen', path: '/breweries' },
  { label: 'Venues', path: '/venues' },
  { label: 'Kaart', path: '/map' },
  { label: 'Over', path: '/about' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 group">
          <span className="font-serif text-xl tracking-tight text-foreground">
            MissBaxel<span className="text-accent font-normal">'s</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors ${
                pathname === item.path
                  ? 'text-accent bg-accent/8'
                  : 'text-muted-foreground hover:text-foreground'
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
          className="md:hidden h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border/60 bg-background px-5 py-3 space-y-0.5">
          <Link
            to="/"
            className={`block px-3 py-2.5 text-sm font-medium rounded-lg ${
              pathname === '/' ? 'text-accent bg-accent/8' : 'text-muted-foreground'
            }`}
          >
            Home
          </Link>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg ${
                pathname === item.path ? 'text-accent bg-accent/8' : 'text-muted-foreground'
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
