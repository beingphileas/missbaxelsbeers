import { Pause } from 'lucide-react';

export default function BierstekersPauseBanner() {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-6">
      <div
        className="flex items-start gap-3 rounded-[12px] px-4 py-3"
        style={{
          background: 'var(--hop-light, #FAF6E8)',
          border: '1px solid var(--line, #E8E2D0)',
        }}
      >
        <Pause
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--copper, #B97A3A)' }}
        />
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--ink, #2A1F14)',
            margin: 0,
          }}
        >
          <strong style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
            Dit project staat momenteel op pauze.
          </strong>{' '}
          Hier vind je het volledige archief van alle blends die Marijke en Koen
          maakten.
        </p>
      </div>
    </div>
  );
}
