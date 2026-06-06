import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const LINKS = [
  { label: 'Verhalen', path: '/verhalen' },
  { label: 'Onze Bieren', path: '/beers' },
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
        background: 'rgba(250, 249, 246, 0.85)',
        borderBottom: '1px solid hsl(38 18% 88%)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Wordmark — centered feel, left-aligned */}
        <Link
          to="/"
          className="shrink-0 no-underline tracking-tight"
          aria-label="MissBaxel's Beers home"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: 20,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          MissBaxel's Beers
        </Link>

        {/* Desktop nav — refined, minimal */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative no-underline select-none"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  letterSpacing: '0.02em',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.textUnderlineOffset = '3px';
                  e.currentTarget.style.textDecorationThickness = '1px';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.textDecoration = 'none';
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
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity duration-200"
              style={{ color: 'var(--ink)' }}
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Inloggen"
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity duration-200"
              style={{ color: 'var(--ink)' }}
            >
              <LogIn size={15} strokeWidth={1.5} />
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
              width: 22,
              height: 1.5,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(4.5px) rotate(45deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 22,
              height: 1.5,
              background: 'var(--ink)',
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.15s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 22,
              height: 1.5,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(-4.5px) rotate(-45deg)' : 'none',
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
            borderTop: '1px solid hsl(38 18% 88%)',
            background: 'rgba(250, 249, 246, 0.95)',
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
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 15,
                  fontWeight: 400,
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  padding: '14px 24px',
                  letterSpacing: '0.02em',
                  borderBottom: '1px solid hsl(38 18% 88%)',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="flex items-center px-6 py-4"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
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
