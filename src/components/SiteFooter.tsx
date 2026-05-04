import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import logo from '@/assets/missbaxels-logo.jpg';

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background mt-16">
      <div className="max-w-[1400px] mx-auto px-5 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-3">
            <img
              src={logo}
              alt="MissBaxel's Beers"
              className="h-9 w-9 rounded-full object-cover border border-accent/30"
            />
            <span className="font-display text-lg tracking-tight">
              MissBaxel<span className="text-accent font-light">'s</span> Beers
            </span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {t('Recepten, smaakdromen en vakmanschap — gebrouwen samen met de beste collega-brouwers van België.')}
          </p>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
            {t('Verkennen')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/beers" className="text-muted-foreground hover:text-foreground transition-colors">{t('Bieren')}</Link></li>
            <li><Link to="/stories" className="text-muted-foreground hover:text-foreground transition-colors">{t('Verhalen')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-bierstekers mb-3">
            Bierstekers
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/bierstekers" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('Over de werking')}
              </Link>
            </li>
            <li>
              <Link to="/bierstekers/archief" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('Het archief')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/30">
        <div className="max-w-[1400px] mx-auto px-5 py-4 text-[11px] text-muted-foreground text-center">
          © {year} MissBaxel's Beers <span className="text-bierstekers/70">·</span> {t('Inclusief de Bierstekers-werking')}
        </div>
      </div>
    </footer>
  );
}

