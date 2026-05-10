import { MapPin, Heart, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const INFO_PILLS = [
  { Icon: MapPin, label: 'Brugge' },
  { Icon: Heart, label: 'Kleine brouwerijen' },
  { Icon: Users, label: 'Voor iedereen' },
];

const TAGS = ['Belgisch bier', 'Kleine brouwerijen', 'Collabs', 'Brugge'];

const WINNERS = [
  {
    label: 'Restaurant',
    title: 'Bieren die écht bij het gerecht passen',
    body: 'Geen standaard kaart, maar bieren die het menu verlengen en versterken.',
    badge: 'Op tafel',
    color: 'hsl(var(--tertiary))',
    light: 'hsl(var(--tertiary-light))',
  },
  {
    label: 'Brouwer',
    title: 'Creatieve vrijheid met een gegarandeerd podium',
    body: 'Geen briefing, geen lastenboek — wel een vaste plek waar het bier geserveerd wordt.',
    badge: 'In de ketel',
    color: 'hsl(var(--secondary))',
    light: 'hsl(var(--secondary-light))',
  },
  {
    label: 'Liefhebber',
    title: 'Bieren die je nergens anders vindt',
    body: 'Eigenwijze, kleine brouwsels — kort beschikbaar, lang nagesmaakt.',
    badge: 'In het glas',
    color: 'hsl(var(--primary))',
    light: 'hsl(var(--primary-light))',
  },
];

const TIMELINE = [
  { when: 'Begin', title: 'Uit de Kempen', desc: 'Marijke groeit op in de Kempen, met een neus voor smaak en verhalen.' },
  { when: 'Restaurant', title: 'Bij Koen & Marijke', desc: 'Samen met Koen opent ze het restaurant in \'t Nieuw Museum, Brugge.' },
  { when: '2021', title: 'Eerste collab', desc: 'Een eerste smaakdroom belandt in een ketel van een bevriende brouwer.' },
  { when: 'Nu', title: 'Een groeiend assortiment', desc: 'Een vast netwerk van brouwers, en een catalogus die blijft uitbreiden.' },
];

export default function Over() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* ─── 1. HERO ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-5 py-12">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: 'hsl(var(--secondary-light))', color: 'hsl(var(--secondary))' }}
          >
            {t('Het verhaal')}
          </span>

          <h1
            className="font-display mt-4 text-foreground"
            style={{ fontWeight: 900, fontSize: '44px', lineHeight: 1.05, letterSpacing: '-0.025em' }}
          >
            {t('Bier proeven, verhalen')}{' '}
            <em
              className="not-italic"
              style={{ fontStyle: 'italic', fontWeight: 300, color: 'hsl(var(--secondary))' }}
            >
              {t('vertellen.')}
            </em>
          </h1>

          <blockquote
            className="mt-7 max-w-[760px]"
            style={{
              borderLeft: '3px solid hsl(var(--secondary))',
              background: 'hsl(var(--secondary-light))',
              padding: '20px 24px',
              borderRadius: '0 12px 12px 0',
            }}
          >
            <p
              className="font-serif italic text-foreground"
              style={{ fontSize: '18px', lineHeight: 1.5 }}
            >
              {t('Verwacht geen hoogdravende termen of technisch gegoochel. Ik doe het op mijn manier: rechttoe, rechtaan.')}
            </p>
          </blockquote>
        </div>
      </section>

      {/* ─── 2. BIO + QUOTE CARD ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Bio */}
          <div>
            <div className="space-y-4 text-[14px] leading-relaxed text-muted-foreground">
              <p>{t('Mijn naam is Marijke Bax. Uit de Kempen, de liefde gevolgd naar West-Vlaanderen. Samen met mijn man Koen baat ik restaurant Bij Koen & Marijke in \'t Nieuw Museum in Brugge uit.')}</p>
              <p>{t('De liefde voor bier groeide mee met het restaurant. Ik stapt met ideeën naar bevriende brouwers — geen briefing, geen lastenboek. De brouwer krijgt de vrije hand.')}</p>
              <p>{t('Goed voor het restaurant, goed voor de brouwer — en het allermeest voor de bierliefhebber.')}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {INFO_PILLS.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 text-[12px] text-foreground"
                >
                  <Icon size={13} className="text-primary" /> {t(label)}
                </span>
              ))}
            </div>
          </div>

          {/* Quote card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full inline-flex items-center justify-center font-display"
                style={{ background: 'hsl(var(--primary-light))', color: '#27500A', fontWeight: 700, fontSize: '14px' }}
              >
                MB
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Marijke Bax</div>
                <div className="text-[11px] text-muted-foreground">Bij Koen & Marijke · Brugge</div>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              <p>{t('Een bier hoeft geen prijs te winnen om bijzonder te zijn. Het moet vooral kloppen — bij de mensen die het maken én drinken.')}</p>
              <p>{t('Daarom werk ik graag met kleine brouwers. Niet om snel te groeien, maar om eerlijk te blijven.')}</p>
            </div>

            <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
                >
                  {t(tag)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. WINNERS ─── */}
      <section className="bg-cream border-b border-border">
        <div className="max-w-[1100px] mx-auto px-5 py-11">
          <h2
            className="font-display text-foreground"
            style={{ fontWeight: 900, fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('Goed voor iedereen')}
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {WINNERS.map(w => (
              <div
                key={w.label}
                className="bg-card border border-border p-6"
                style={{ borderRadius: 12, borderTop: `3px solid ${w.color}` }}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: w.color }}
                >
                  {t(w.label)}
                </span>
                <h3
                  className="font-display mt-2 text-foreground"
                  style={{ fontWeight: 700, fontSize: '18px', lineHeight: 1.25 }}
                >
                  {t(w.title)}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t(w.body)}</p>

                <span
                  className="inline-flex items-center mt-5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ background: w.light, color: w.color }}
                >
                  {t(w.badge)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. TIMELINE ─── */}
      <section className="border-b border-border">
        <div className="max-w-[800px] mx-auto px-5 py-12">
          <h2
            className="font-display text-foreground"
            style={{ fontWeight: 900, fontSize: '32px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('Hoe het groeide')}
          </h2>

          <div className="mt-7">
            {TIMELINE.map((item, i) => (
              <div
                key={item.when}
                className={`flex gap-5 py-4 ${i < TIMELINE.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div
                  className="font-display text-primary shrink-0"
                  style={{ fontWeight: 700, fontSize: '13px', minWidth: 60, lineHeight: 1.5 }}
                >
                  {t(item.when)}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-foreground">{t(item.title)}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{t(item.desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
