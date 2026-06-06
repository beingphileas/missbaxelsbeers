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
        background: 'rgba(250, 248, 245, 0.78)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
      }}
    >
      {/* Soft shadow instead of border */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(58, 42, 31, 0.08), transparent)',
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-5 flex items-center justify-between relative">
        {/* Logo with terracotta accent */}
        <Link
          to="/"
          className="shrink-0 no-underline group"
          aria-label="MissBaxel's Beers home"
        >
          <span
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: '#3a2a1f',
              letterSpacing: '-0.02em',
            }}
          >
            MissBaxel's
          </span>
          <span
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 22,
              color: '#8a7868',
              letterSpacing: '-0.02em',
              marginLeft: 4,
            }}
          >
            Beers
          </span>
          <span
            className="inline-block ml-0.5 transition-transform duration-300 group-hover:scale-125"
            style={{
              color: '#c4663a',
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            .
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="no-underline select-none rounded-full px-5 py-2 relative"
                style={{
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: active ? '#c4663a' : '#3a2a1f',
                  letterSpacing: '-0.01em',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#c4663a';
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = '#3a2a1f';
                  }
                }}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'rgba(196, 102, 58, 0.10)',
                      transition: 'all 200ms ease',
                    }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}

          {/* Auth — small, quiet */}
          {user ? (
            <button
              onClick={signOut}
              aria-label="Uitloggen"
              className="ml-2 rounded-full p-2 transition-all duration-200 hover:bg-[rgba(196,102,58,0.08)]"
              style={{ color: '#8a7868' }}
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Inloggen"
              className="ml-2 rounded-full p-2 transition-all duration-200 hover:bg-[rgba(196,102,58,0.08)]"
              style={{ color: '#8a7868' }}
            >
              <LogIn size={16} strokeWidth={1.5} />
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex flex-col items-center justify-center gap-1.5 rounded-full p-2 transition-colors hover:bg-[rgba(196,102,58,0.08)]"
          style={{ width: 40, height: 40, color: '#3a2a1f' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span
            style={{
              display: 'block',
              width: 22,
              height: 2,
              background: '#3a2a1f',
              borderRadius: 2,
              transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 22,
              height: 2,
              background: '#3a2a1f',
              borderRadius: 2,
              opacity: mobileOpen ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
          <span
            style={{
              display: 'block',
              width: 22,
              height: 2,
              background: '#3a2a1f',
              borderRadius: 2,
              transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden"
          style={{
            background: 'rgba(250, 248, 245, 0.95)',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
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
                  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: active ? '#c4663a' : '#3a2a1f',
                  padding: '14px 24px',
                  letterSpacing: '-0.01em',
                  borderBottom: '1px solid rgba(232, 224, 210, 0.6)',
                  background: active ? 'rgba(196, 102, 58, 0.06)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="flex items-center px-6 py-4"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontSize: 14,
              color: '#8a7868',
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
