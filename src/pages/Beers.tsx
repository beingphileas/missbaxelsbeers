import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBeers, type Beer } from '@/data/beers';
import {
  Search, Beer as BeerIcon, Leaf, Sun, Droplet, Citrus, Sparkles, Wheat, Flame,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type StyleCat = 'all' | 'tripel' | 'saison' | 'donker' | 'sour';

const STYLE_FILTERS: { id: StyleCat; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'tripel', label: 'Tripel & Dubbel' },
  { id: 'saison', label: 'Saison' },
  { id: 'donker', label: 'Donker' },
  { id: 'sour', label: 'Zuur & Sour' },
];

function matchesCategory(style: string, cat: StyleCat): boolean {
  if (cat === 'all') return true;
  const s = style.toLowerCase();
  if (cat === 'tripel') return /tripel|dubbel|trippel|abdij|quadrupel|quad/.test(s);
  if (cat === 'saison') return /saison|farmhouse|grisette/.test(s);
  if (cat === 'donker')
    return /stout|porter|donker|dark|imperial|bruin|brown|schwarz/.test(s);
  if (cat === 'sour')
    return /sour|zuur|lambiek|lambic|gueuze|geuze|kriek|wild|brett/.test(s);
  return true;
}

function iconForStyle(style: string) {
  const s = (style || '').toLowerCase();
  if (/tripel|dubbel|abdij|quad/.test(s)) return Leaf;
  if (/saison|farmhouse|grisette/.test(s)) return Sun;
  if (/stout|porter|donker|dark|imperial|bruin|schwarz/.test(s)) return Droplet;
  if (/sour|zuur|lambiek|lambic|gueuze|geuze|kriek|wild|brett/.test(s)) return Citrus;
  if (/ipa|pale|hop/.test(s)) return Flame;
  if (/wit|wheat|weizen|blanche/.test(s)) return Wheat;
  return BeerIcon;
}

export default function Beers() {
  const { data: beers = [], isLoading } = useBeers();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'current' | 'archive'>('current');
  const [cat, setCat] = useState<StyleCat>('all');

  const current = useMemo(() => beers.filter(b => b.lifecycleStatus === 'current'), [beers]);
  const archive = useMemo(() => beers.filter(b => b.lifecycleStatus === 'archive'), [beers]);

  const filterFn = (list: Beer[]) => {
    const q = search.trim().toLowerCase();
    return list
      .filter(b => matchesCategory(b.style || '', cat))
      .filter(b => {
        if (!q) return true;
        return (
          b.name.toLowerCase().includes(q) ||
          b.style.toLowerCase().includes(q) ||
          b.flavorProfile.some(f => f.toLowerCase().includes(q))
        );
      });
  };

  const visible = filterFn(tab === 'current' ? current : archive);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 py-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
          >
            <BeerIcon size={12} /> {t('Catalogus')}
          </span>
          <h1
            className="font-display mt-3 text-foreground"
            style={{ fontWeight: 900, fontSize: '36px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('De bieren')}
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-[560px]">
            {t('Alles wat MissBaxel ontwikkelde — gebrouwen in samenwerking met collega-brouwers.')}
          </p>
        </div>
      </section>

      {/* ─── Filter bar ─── */}
      <section className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-5 py-3 flex flex-wrap items-center gap-3">
          {/* Tab pills */}
          <div className="inline-flex items-center gap-1 border border-border rounded-full p-0.5 bg-card">
            {(['current', 'archive'] as const).map(tk => (
              <button
                key={tk}
                onClick={() => setTab(tk)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  tab === tk ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tk === 'current' ? `${t('Huidig')} (${current.length})` : `${t('Archief')} (${archive.length})`}
              </button>
            ))}
          </div>

          {/* Style filters */}
          <div className="flex flex-wrap gap-1.5">
            {STYLE_FILTERS.map(f => {
              const active = cat === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCat(f.id)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors"
                  style={{
                    borderColor: active ? 'hsl(var(--primary-mid))' : 'hsl(var(--border))',
                    background: active ? 'hsl(var(--primary-light))' : 'transparent',
                    color: active ? '#27500A' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {t(f.label)}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] ml-auto max-w-[280px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Zoek bier, stijl of smaak…')}
              className="w-full h-9 pl-9 pr-3 text-[12px] bg-card border border-border rounded-full focus:outline-none focus:border-primary-mid placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {/* ─── List ─── */}
      <section className="max-w-[1200px] mx-auto px-5 py-5">
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-12">{t('Laden…')}</p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">{t('Geen bieren gevonden.')}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visible.map(beer => <BeerRow key={beer.id} beer={beer} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function BeerRow({ beer }: { beer: Beer }) {
  const { t } = useLanguage();
  const Icon = iconForStyle(beer.style);
  const isArchive = beer.lifecycleStatus === 'archive';

  return (
    <Link
      to={`/beers/${beer.id}`}
      className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 transition-all hover:translate-x-[2px]"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary-mid))')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
    >
      {/* Icon square */}
      <div
        className="shrink-0 inline-flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'hsl(var(--primary-light))',
          color: 'hsl(var(--primary))',
        }}
      >
        <Icon size={20} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-foreground truncate" style={{ fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>
          {beer.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="truncate">{beer.style || t('Stijl onbekend')}</span>
          {(beer.brewedAt || beer.breweryName) && (
            <>
              <span
                className="inline-block shrink-0 rounded-full"
                style={{ width: 3, height: 3, background: 'hsl(var(--muted-foreground))' }}
              />
              <span className="truncate">{beer.brewedAt || beer.breweryName}</span>
            </>
          )}
        </div>

        {beer.flavorProfile.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {beer.flavorProfile.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-primary tabular-nums" style={{ fontWeight: 900, fontSize: '22px', lineHeight: 1 }}>
            {beer.abv ? beer.abv.toFixed(1) : '—'}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">% ABV</span>
        </div>

        <div className="flex flex-wrap justify-end gap-1">
          {isArchive && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
            >
              {t('Archief')}
            </span>
          )}
          {beer.featured && !isArchive && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: 'hsl(var(--secondary-light))', color: 'hsl(var(--secondary))' }}
            >
              {t('Uitgelicht')}
            </span>
          )}
          {beer.isHiddenGem && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
            >
              <Sparkles size={8} /> {t('Nieuw')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
