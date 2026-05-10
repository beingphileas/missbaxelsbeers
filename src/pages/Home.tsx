import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Beer as BeerIcon, Sparkles, Handshake, Lightbulb, FlaskConical, GlassWater } from 'lucide-react';
import { useBeers, type Beer } from '@/data/beers';
import { useLanguage } from '@/hooks/useLanguage';

const HERO_BEER_NAMES = ['Totetrekkerie', 'Maria Guimauva', 'MissBaxels Tripel'];

const HERO_ICON_VARIANTS = [
  { bg: 'hsl(var(--primary-light))', color: 'hsl(var(--primary))', Icon: BeerIcon },
  { bg: 'hsl(var(--secondary-light))', color: 'hsl(var(--secondary))', Icon: Sparkles },
  { bg: 'hsl(var(--tertiary-light))', color: 'hsl(var(--tertiary))', Icon: Handshake },
];

const STATS = [
  { value: '24', label: 'Bieren in assortiment' },
  { value: '11', label: 'Bevriende brouwers' },
  { value: '6', label: 'Bierstekers blends' },
  { value: '2019', label: 'Opgericht' },
];

const STEPS = [
  {
    n: '01',
    title: 'Het idee',
    desc: 'Marijke vertrekt vanuit een smaakdroom — een herinnering, een ingrediënt, een gevoel.',
    Icon: Lightbulb,
    bg: 'hsl(var(--primary-light))',
    color: 'hsl(var(--primary))',
  },
  {
    n: '02',
    title: 'De brouwer',
    desc: 'Een bevriende brouwer krijgt de vrije hand. Vakmanschap mag de smaak vertalen.',
    Icon: FlaskConical,
    bg: 'hsl(var(--secondary-light))',
    color: 'hsl(var(--secondary))',
  },
  {
    n: '03',
    title: 'In het glas',
    desc: 'Het resultaat: een uniek bier dat enkel hier ontstaat — voor de liefhebber.',
    Icon: GlassWater,
    bg: 'hsl(var(--tertiary-light))',
    color: 'hsl(var(--tertiary))',
  },
];

export default function Home() {
  const { data: beers = [] } = useBeers();
  const { t } = useLanguage();

  const heroBeers = HERO_BEER_NAMES
    .map(name => beers.find(b => b.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean) as Beer[];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── 1. HERO ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 py-[52px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
            >
              <MapPin size={12} /> Brugge · West-Vlaanderen
            </span>

            <h1
              className="font-display mt-5 text-foreground"
              style={{ fontWeight: 900, fontSize: '48px', lineHeight: 1.05, letterSpacing: '-0.03em' }}
            >
              {t('Ideeën brengen,')}{' '}
              <br className="hidden md:block" />
              {t('bieren laten')}{' '}
              <em className="font-italic-accent text-primary not-italic" style={{ fontStyle: 'italic', fontWeight: 300 }}>
                {t('ontstaan.')}
              </em>
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-[360px]">
              {t('Marijke Bax stapt met een smaakdroom naar bevriende brouwers. De brouwer krijgt de vrije hand. Het resultaat is iets dat je nergens anders vindt.')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/beers"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-[13px] font-semibold hover:bg-primary/90 transition-colors"
              >
                <BeerIcon size={15} /> {t('Ontdek de bieren')}
              </Link>
              <Link
                to="/over"
                className="inline-flex items-center gap-2 border border-border bg-card text-foreground rounded-full px-5 py-2.5 text-[13px] font-semibold hover:border-primary-mid transition-colors"
              >
                {t('Lees het verhaal')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right — beer cards */}
          <div className="flex flex-col gap-3">
            {heroBeers.map((beer, i) => {
              const v = HERO_ICON_VARIANTS[i % HERO_ICON_VARIANTS.length];
              const Icon = v.Icon;
              return (
                <Link
                  key={beer.id}
                  to={`/beers/${beer.id}`}
                  className="group flex items-center gap-4 bg-card border border-border rounded-xl p-3 transition-all hover:translate-x-[3px]"
                  style={{ borderColor: undefined }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary-mid))')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <div
                    className="shrink-0 w-12 h-12 inline-flex items-center justify-center"
                    style={{ background: v.bg, color: v.color, borderRadius: 10 }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[14px] font-bold text-foreground truncate">{beer.name}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {beer.breweryName ? `${beer.breweryName} · ${beer.style}` : beer.style}
                    </div>
                  </div>
                  <div
                    className="font-display text-primary tabular-nums shrink-0"
                    style={{ fontWeight: 900, fontSize: '22px' }}
                  >
                    {beer.abv ? `${beer.abv}%` : '—'}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 2. STATS ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`py-7 px-5 text-center ${i < STATS.length - 1 ? 'md:border-r border-border' : ''} ${i % 2 === 0 ? 'border-r md:border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} border-border`}
            >
              <div
                className="font-display text-primary tabular-nums"
                style={{ fontWeight: 900, fontSize: '28px', lineHeight: 1.1 }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[11px] font-medium text-muted-foreground">{t(s.label)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. VERHAAL ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 py-[44px] grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: 'hsl(var(--secondary-light))', color: 'hsl(var(--secondary))' }}
            >
              {t('Het verhaal')}
            </span>

            <h2
              className="font-display mt-4 text-foreground"
              style={{ fontWeight: 900, fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
            >
              {t('Geen eigen brouwketel.')}{' '}
              <em className="not-italic" style={{ fontStyle: 'italic', fontWeight: 300, color: 'hsl(var(--secondary))' }}>
                {t('Dat is de kracht.')}
              </em>
            </h2>

            <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-muted-foreground">
              <p>{t('MissBaxel\'s heeft bewust geen eigen brouwerij. Wat er wél is: een uitgelezen netwerk van bevriende brouwers die graag mee dromen.')}</p>
              <p>{t('Elk recept vertrekt vanuit een idee van Marijke. Vanaf daar krijgt de brouwer de volledige vrijheid — geen formules, geen sjablonen.')}</p>
              <p>{t('Dat is goed voor de brouwers, goed voor de cafés, en het allermeest voor de liefhebber.')}</p>
            </div>
          </div>

          {/* Quote card */}
          <div className="bg-card border border-border rounded-2xl p-7 relative">
            <div
              className="font-display absolute top-3 left-5 select-none"
              style={{ fontWeight: 900, fontSize: '72px', lineHeight: 1, color: 'hsl(var(--primary-light))' }}
              aria-hidden
            >
              "
            </div>
            <p
              className="font-serif italic text-foreground relative z-10 mt-6"
              style={{ fontSize: '18px', lineHeight: 1.55 }}
            >
              {t('Een bier mag eigenwijs zijn. Het mag traag ontstaan, en zichzelf zijn. Daarvoor moet je geen eigen ketel hebben — alleen goede vrienden met een ketel.')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full inline-flex items-center justify-center font-display"
                style={{ background: 'hsl(var(--primary-light))', color: '#27500A', fontWeight: 700, fontSize: '13px' }}
              >
                MB
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">Marijke Bax</div>
                <div className="text-[11px] text-muted-foreground">{t('Oprichter · MissBaxel\'s')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. COLLAB FLOW ─── */}
      <section className="bg-cream">
        <div className="max-w-[1200px] mx-auto px-5 py-[44px]">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
          >
            {t('Hoe het werkt')}
          </span>

          <h2
            className="font-display mt-4 text-foreground"
            style={{ fontWeight: 900, fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('Van idee tot glas')}
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map(step => {
              const Icon = step.Icon;
              return (
                <div key={step.n} className="bg-card border border-border p-[22px] relative" style={{ borderRadius: 14 }}>
                  <div
                    className="font-display absolute top-3 right-4 select-none"
                    style={{ fontWeight: 900, fontSize: '46px', lineHeight: 1, color: 'hsl(var(--border))' }}
                    aria-hidden
                  >
                    {step.n}
                  </div>
                  <div
                    className="inline-flex items-center justify-center"
                    style={{ width: 38, height: 38, background: step.bg, color: step.color, borderRadius: 10 }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="mt-4 text-[14px] font-semibold text-foreground">{t(step.title)}</div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{t(step.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
