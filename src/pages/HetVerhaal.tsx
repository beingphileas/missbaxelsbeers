import SEOHead from '@/components/SEOHead';
import { useLanguage } from '@/hooks/useLanguage';

const SERIF = "'Lora', Georgia, serif";
const SANS = "'Nunito Sans', system-ui, sans-serif";



export default function HetVerhaal() {
  const { t } = useLanguage();
  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SEOHead
        title="Het verhaal — MissBaxel's Beers"
        description="Bier, met goesting. Geen sommelierspraat, geen hoogdravend gedoe. Ik proef, ik vraag, ik vertel. Dat is het zo'n beetje."
        url="/verhaal"
      />

      {/* Main content area — vertically centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-2xl w-full text-center">
          {/* Kicker */}
          <span
            style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--copper)',
            }}
          >
            MissBaxel's Beers
          </span>

          {/* Title */}
          <h1
            className="mt-6 mb-10"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 'clamp(42px, 8vw, 72px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            {t('Het verhaal')}
          </h1>

          {/* Decorative divider */}
          <div
            className="mx-auto mb-10"
            style={{
              width: 48,
              height: 2,
              background: 'var(--amber)',
            }}
          />

          {/* Lead line */}
          <p
            className="mb-8"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 'clamp(22px, 3vw, 32px)',
              lineHeight: 1.3,
              fontStyle: 'italic',
              color: 'var(--ink)',
            }}
          >
            {t('Bier, met')}{' '}
            <em
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--amber)',
              }}
            >
              {t('goesting.')}
            </em>
          </p>

          {/* Body text */}
          <div
            className="space-y-6 mx-auto"
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(16px, 1.8vw, 20px)',
              lineHeight: 1.7,
              color: 'rgba(107,58,42,0.88)',
              maxWidth: 520,
              fontStyle: 'italic',
            }}
          >
            <p>
              {t("Geen sommelierspraat, geen hoogdravend gedoe. Ik proef, ik vraag, ik vertel. Dat is het zo'n beetje.")}
            </p>
            <p>
              {t('Ik ben Marijke. Ergens onderweg ontdekte ik dat bier veel meer is dan ik dacht — en dat ik het niet voor mezelf kon houden.')}
            </p>
            <p>
              {t('Ik brouw niet zelf. Maar ik heb ideeën, en ik ken de mensen die er iets moois van kunnen maken. Kleine brouwers met grote passie, die je misschien nog niet kent. Die verdienen een podium.')}
            </p>
          </div>

          {/* Signature */}
          <div
            className="mt-14"
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.04em',
            }}
          >
            — Marijke Bax
          </div>
        </div>
      </main>

      {/* Bottom link to full story */}
      <div
        className="pb-16 flex justify-center"
        style={{ fontFamily: SANS, fontSize: 13 }}
      >
        <a
          href="/over"
          className="inline-flex items-center gap-2 no-underline transition-colors hover:opacity-80"
          style={{ color: 'var(--copper)' }}
        >
          Lees het volledige verhaal
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
