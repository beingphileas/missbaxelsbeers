import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const LINKS = [
  { label: 'Verhalen', path: '/verhalen' },
  { label: 'Bieren', path: '/beers' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: '#f8f9fa',
        borderBottom: '2px solid #0a0a0a',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-5 flex items-center justify-between">
        {/* Logo — far left */}
        <Link
          to="/"
          className="shrink-0 no-underline"
          aria-label="MissBaxel's Beers home"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: '#0a0a0a',
            letterSpacing: '-0.04em',
          }}
        >
          MissBaxel's Beers
        </Link>

        {/* Desktop nav — far right */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="no-underline select-none"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? '#2b4cff' : '#0a0a0a',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  textDecoration: active ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                  textDecorationThickness: '2px',
                  textDecorationColor: '#2b4cff',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#2b4cff';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.color = '#0a0a0a';
                }}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Auth — small, quiet */}
          {user ? (
            <button
              onClick={signOut}
              aria-label="Uitloggen"
              className="opacity-40 hover:opacity-100 transition-opacity duration-200"
              style={{ color: '#0a0a0a' }}
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Inloggen"
              className="opacity-40 hover:opacity-100 transition-opacity duration-200"
              style={{ color: '#0a0a0a' }}
            >
              <LogIn size={15} strokeWidth={1.5} />
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex flex-col items-center justify-center gap-1.5"
          style={{ width: 36, height: 36, color: '#0a0a0a' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: '#0a0a0a',
              transform: mobileOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: '#0a0a0a',
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.15s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: '#0a0a0a',
              transform: mobileOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden"
          style={{
            borderTop: '2px solid #0a0a0a',
            background: '#f8f9fa',
          }}
        >
          {LINKS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="block no-underline"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: active ? '#2b4cff' : '#0a0a0a',
                  padding: '16px 24px',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="flex items-center px-6 py-4"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            {user ? (
              <button onClick={signOut} className="hover:opacity-70 transition-opacity">
                Uitloggen
              </button>
            ) : (
              <Link to="/login" className="hover:opacity-70 transition-opacity">
                Inloggen
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
