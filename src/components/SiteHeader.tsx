import { Link, useLocation } from 'react-router-dom';
import { Map, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Tastings', path: '/tastings' },
  { label: 'Brouwerijen', path: '/breweries' },
  { label: 'Waar?', path: '/venues' },
  { label: 'Kaart', path: '/map' },
  { label: 'Over', path: '/about' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-tight text-foreground">
            MissBaxel<span className="text-accent">'s</span> Beers
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === item.path
                  ? 'text-accent bg-accent/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/map">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Map size={14} />
              Kaart
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium rounded-md ${
                pathname === item.path
                  ? 'text-accent bg-accent/10'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
