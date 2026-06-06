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
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(248, 249, 250, 0.85)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-8 md:px-12 lg:px-16 py-6 flex items-center justify-between">
        {/* Logo — far left */}
        <Link
          to="/"
          className="shrink-0 no-underline"
          aria-label="MissBaxel's Beers home"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: 'var(--ink)',
            letterSpacing: '-0.04em',
          }}
        >
          MissBaxel's Beers
        </Link>

        {/* Desktop nav — far right, bold, minimal */}
        <nav className="hidden md:flex items-center gap-10">
          {LINKS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative no-underline select-none"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: active ? '#2b4cff' : 'var(--ink)',
                  letterSpacing: '-0.02em',
                  textDecoration: active ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                  textDecorationThickness: '2px',
                  textDecorationColor: '#2b4cff',
                  transition: 'color 0.2s ease, text-decoration-color 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.textDecorationThickness = '2.5px';
                  e.currentTarget.style.textUnderlineOffset = '5px';
                  e.currentTarget.style.textDecorationColor = '#0a0a0a';
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.textDecoration = 'none';
                  } else {
                    e.currentTarget.style.textDecorationColor = '#2b4cff';
                    e.currentTarget.style.textUnderlineOffset = '4px';
                    e.currentTarget.style.textDecorationThickness = '2px';
                  }
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
              className="ml-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
              style={{ color: 'var(--ink)' }}
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Inloggen"
              className="ml-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
              style={{ color: 'var(--ink)' }}
            >
              <LogIn size={16} strokeWidth={1.5} />
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex flex-col items-center justify-center gap-1.5"
          style={{ width: 36, height: 36, color: 'var(--ink)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: 'var(--ink)',
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.15s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 24,
              height: 2,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Mobile nav — minimal drawer */}
      {mobileOpen && (
        <nav
          className="md:hidden"
          style={{
            borderTop: '1px solid #e5e7eb',
            background: 'rgba(248, 249, 250, 0.95)',
            backdropFilter: 'blur(12px)',
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
                  fontSize: 18,
                  fontWeight: 600,
                  color: active ? '#2b4cff' : 'var(--ink)',
                  padding: '18px 32px',
                  letterSpacing: '-0.02em',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="flex items-center px-8 py-5"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              fontSize: 15,
              color: 'var(--muted)',
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
