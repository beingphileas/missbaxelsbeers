import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const linkStyle = { color: 'var(--ink)', borderBottom: '1px solid var(--line)' } as const;

const NotFound = () => (
  <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '70vh' }}>
    <SEOHead
      title="Pagina niet gevonden"
      description="Deze pagina bestaat niet (meer)."
      noindex
    />
    <div className="max-w-2xl mx-auto px-5 py-24 text-center">
      <p className="text-[12px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }}>404</p>
      <h1 className="mt-3" style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.15 }}>
        Deze pagina is leeggedronken.
      </h1>
      <p className="mt-4" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
        Of ze heeft hier nooit gestaan. Hubby zoekt nog onder de toog, maar je vindt het meeste hieronder.
      </p>
      <nav className="mt-8 flex flex-wrap justify-center gap-6 text-[15px] font-semibold" aria-label="Verder lezen">
        <Link to="/" style={linkStyle}>Naar de homepage</Link>
        <Link to="/beers" style={linkStyle}>Bieren</Link>
        <Link to="/verhalen" style={linkStyle}>Verhalen</Link>
      </nav>
    </div>
  </div>
);

export default NotFound;
