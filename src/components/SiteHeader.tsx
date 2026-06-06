import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const DISPLAY = "'Archivo Black', 'Bebas Neue', Impact, sans-serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const PILLARS = [
  { label: 'LEES', path: '/verhalen' },
  { label: 'PROEF', path: '/beers' },
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
        background: 'var(--bg)',
        borderBottom: '2px solid hsl(0 0% 4%)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">
        {/* Wordmark — centered on desktop, left on mobile */}
        <Link
          to="/"
          className="shrink-0 no-underline"
          aria-label="MissBaxel's Beers home"
          style={{ color: 'var(--ink)' }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            MissBaxel's Beers
          </span>
        </Link>

        {/* Desktop pillars — centered-right */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-end">
          {PILLARS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative no-underline select-none"
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 36,
                  fontWeight: 900,
                  color: active ? 'var(--bg)' : 'var(--ink)',
                  background: active ? 'var(--ink)' : 'transparent',
                  padding: '4px 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  transition: 'all 0.08s ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const t = e.currentTarget;
                    t.style.background = 'var(--ink)';
                    t.style.color = 'var(--bg)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const t = e.currentTarget;
                    t.style.background = 'transparent';
                    t.style.color = 'var(--ink)';
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
              className="ml-4"
              style={{ color: 'var(--ink)' }}
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Inloggen"
              className="ml-4"
              style={{ color: 'var(--ink)' }}
            >
              <LogIn size={16} />
            </Link>
          )}
        </nav>

        {/* Mobile hamburger / pillars toggle */}
        <button
          className="md:hidden inline-flex flex-col items-center justify-center gap-1"
          style={{ width: 40, height: 40, color: 'var(--ink)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span
            style={{
              display: 'block',
              width: 28,
              height: 3,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(6px) rotate(45deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 28,
              height: 3,
              background: 'var(--ink)',
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.08s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 28,
              height: 3,
              background: 'var(--ink)',
              transform: mobileOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {/* Mobile nav — full brutalist */}
      {mobileOpen && (
        <nav
          className="md:hidden"
          style={{
            borderTop: '2px solid hsl(0 0% 4%)',
            background: 'var(--bg)',
          }}
        >
          {PILLARS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="block no-underline"
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 48,
                  fontWeight: 900,
                  color: active ? 'var(--bg)' : 'var(--ink)',
                  background: active ? 'var(--ink)' : 'transparent',
                  padding: '16px 24px',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  borderBottom: '2px solid hsl(0 0% 4%)',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="flex items-center justify-between px-6 py-4" style={{ fontFamily: SANS, fontSize: 14 }}>
            {user ? (
              <button onClick={signOut} style={{ color: 'var(--ink)' }}>
                Uitloggen
              </button>
            ) : (
              <Link to="/login" style={{ color: 'var(--ink)' }}>
                Inloggen
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
