import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'A-Z', path: '/tastings' },
  { label: 'Over mezelf', path: '/about' },
  { label: 'Waar?', path: '/venues' },
  { label: 'Kaart', path: '/map' },
  { label: 'Brouwerijen', path: '/breweries' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <span className="text-lg font-bold tracking-tight text-foreground">
            MissBaxel's Beers
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 ml-8">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 text-sm transition-colors ${
                pathname === item.path
                  ? 'text-accent underline underline-offset-4 decoration-2'
                  : 'text-foreground hover:text-accent'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop search */}
        <div className="hidden md:flex items-center">
          <span className="text-sm text-foreground cursor-pointer hover:text-accent transition-colors">
            Search
          </span>
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
        <div className="md:hidden border-t border-border bg-background px-6 pb-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block py-2.5 text-sm ${
                pathname === item.path
                  ? 'text-accent'
                  : 'text-foreground'
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
