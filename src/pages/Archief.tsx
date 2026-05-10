import { useState, useMemo } from 'react';
import { Archive, BookOpen, FlaskConical, Star, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type BlogCat = 'all' | 'belgisch' | 'sour' | 'donker' | 'speciaal';
type BlendCat = 'all' | 'zuur' | 'lambic' | 'donker' | 'wit';

interface BlogPost {
  title: string;
  slug: string;
  url: string;
  date: string;
  style: string;
  cat: Exclude<BlogCat, 'all'>;
}

interface Blend {
  name: string;
  style: string;
  year: string;
  rating: number;
  url: string;
  cat: Exclude<BlendCat, 'all'>;
}

const BLOG: BlogPost[] = [
  { title: 'Hanssens Oude Kriek', slug: 'hanssens-oude-kriek', url: 'https://www.missbaxelsbeers.com/bier/hanssens-oude-kriek/', date: '2021', style: 'Lambic kriek', cat: 'sour' },
  { title: 'Duchesse De Bourgogne', slug: 'duchesse-de-bourgogne', url: 'https://www.missbaxelsbeers.com/bier/duchesse-de-bourgogne/', date: '2021', style: 'Vlaams roodbruin', cat: 'sour' },
  { title: 'Cantillon Geuze', slug: 'cantillon-geuze', url: 'https://www.missbaxelsbeers.com/bier/cantillon-geuze/', date: '2021', style: 'Geuze', cat: 'sour' },
  { title: 'Boon Oude Geuze Mariage Parfait', slug: 'boon-oude-geuze-mariage-parfait', url: 'https://www.missbaxelsbeers.com/bier/boon-oude-geuze-mariage-parfait/', date: '2021', style: 'Oude geuze', cat: 'sour' },
  { title: 'Oud Bruin \'t Verzet', slug: 'oud-bruin-t-verzet', url: 'https://www.missbaxelsbeers.com/bier/oud-bruin-t-verzet/', date: '2021', style: 'Oud bruin', cat: 'sour' },
  { title: 'Cuvée Soeur\'ise', slug: 'cuvee-soeurise', url: 'https://www.missbaxelsbeers.com/bier/cuvee-soeurise/', date: '2021', style: 'Wild ale', cat: 'sour' },

  { title: 'Sportzot', slug: 'sportzot', url: 'https://www.missbaxelsbeers.com/bier/sportzot/', date: '2021', style: 'Alcoholvrije blond', cat: 'belgisch' },
  { title: 'Paljas Saison', slug: 'paljas-saison', url: 'https://www.missbaxelsbeers.com/bier/paljas-saison/', date: '2021', style: 'Saison', cat: 'belgisch' },
  { title: 'Saison De Dottignies', slug: 'saison-de-dottignies', url: 'https://www.missbaxelsbeers.com/bier/saison-de-dottignies/', date: '2021', style: 'Saison', cat: 'belgisch' },
  { title: 'Chimay 150 (groen)', slug: 'chimay-150-groen', url: 'https://www.missbaxelsbeers.com/bier/chimay-150-groen/', date: '2021', style: 'Trappist tripel', cat: 'belgisch' },
  { title: 'Chimay Rouge', slug: 'chimay-rouge', url: 'https://www.missbaxelsbeers.com/bier/chimay-rouge/', date: '2021', style: 'Trappist dubbel', cat: 'belgisch' },
  { title: 'Orval', slug: 'orval', url: 'https://www.missbaxelsbeers.com/bier/orval/', date: '2021', style: 'Trappist', cat: 'belgisch' },
  { title: 'Sint Bernardus Extra 4', slug: 'sint-bernardus-extra-4', url: 'https://www.missbaxelsbeers.com/bier/sint-bernardus-extra-4/', date: '2021', style: 'Abdij blond', cat: 'belgisch' },
  { title: 'Rochefort Triple Extra', slug: 'rochefort-tripel-extra', url: 'https://www.missbaxelsbeers.com/bier/rochefort-tripel-extra/', date: '2021', style: 'Trappist tripel', cat: 'belgisch' },
  { title: 'Dulle Teve', slug: 'dulle-teve', url: 'https://www.missbaxelsbeers.com/bier/dulle-teve/', date: '2021', style: 'Belgian tripel', cat: 'belgisch' },
  { title: 'Redenaar', slug: 'redenaar', url: 'https://www.missbaxelsbeers.com/bier/redenaar/', date: '2021', style: 'Belgian blond', cat: 'belgisch' },
  { title: 'Babylone', slug: 'babylone', url: 'https://www.missbaxelsbeers.com/bier/babylone/', date: '2021', style: 'Blond', cat: 'belgisch' },
  { title: 'Kameradskii Naked', slug: 'kameradski-naked', url: 'https://www.missbaxelsbeers.com/bier/kameradski-naked/', date: '2021', style: 'Special', cat: 'belgisch' },
  { title: 'Vie', slug: 'vie', url: 'https://www.missbaxelsbeers.com/uncategorized/vie/', date: '2022', style: 'Brouwerij Ruimtegist', cat: 'belgisch' },

  { title: 'Cassandra Oyster Stout', slug: 'cassandra-oyster-stout', url: 'https://www.missbaxelsbeers.com/bier/cassandra-oyster-stout/', date: '2021', style: 'Oyster stout', cat: 'donker' },
  { title: 'Mox Jet', slug: 'mox-jet', url: 'https://www.missbaxelsbeers.com/bier/mox-jet/', date: '2021', style: 'Imperial stout', cat: 'donker' },
  { title: 'Noir De Dottignies', slug: 'noir-de-dottignies', url: 'https://www.missbaxelsbeers.com/bier/noir-de-dottignies/', date: '2021', style: 'Belgian dark strong', cat: 'donker' },
  { title: 'Stouterik', slug: 'stouterik', url: 'https://www.missbaxelsbeers.com/bier/stouterik/', date: '2021', style: 'Stout', cat: 'donker' },
  { title: 'Pannepot (2019)', slug: 'pannepot-2019', url: 'https://www.missbaxelsbeers.com/bier/pannepot-2019/', date: '2021', style: 'Quadrupel', cat: 'donker' },
  { title: 'Damme Nation', slug: 'damme-nation', url: 'https://www.missbaxelsbeers.com/uncategorized/damme-nation/', date: '2022', style: 'Donker', cat: 'donker' },

  { title: 'F*** de kerstboom staat in de fik!', slug: 'f-de-kerstboom-staat-in-de-fik', url: 'https://www.missbaxelsbeers.com/uncategorized/f-de-kerstboom-staat-in-de-fik/', date: '2022', style: 'Editorial', cat: 'speciaal' },
  { title: 'De grote pils-proeverij 2.0', slug: 'de-grote-pils-proeverij-2-0', url: 'https://www.missbaxelsbeers.com/uncategorized/de-grote-pils-proeverij-2-0/', date: '2021', style: 'Proeverij', cat: 'speciaal' },
  { title: 'Blik of fles?', slug: 'blik-of-fles', url: 'https://www.missbaxelsbeers.com/bier/blik-of-fles/', date: '2021', style: 'Editorial', cat: 'speciaal' },
];

const BLENDS: Blend[] = [
  { name: 'Zure Pater', style: 'Zure tripel · Bierstekers blend', year: '2022', rating: 3.79, url: 'https://untappd.com/b/bierstekers-zure-pater/4567231', cat: 'zuur' },
  { name: 'Zure Pater IPA', style: 'Sour IPA blend', year: '2022', rating: 3.71, url: 'https://untappd.com/b/bierstekers-zure-pater-ipa/4567232', cat: 'zuur' },
  { name: 'Zure Pater Q', style: 'Quadrupel sour', year: '2022', rating: 3.85, url: 'https://untappd.com/b/bierstekers-zure-pater-q/4567233', cat: 'zuur' },
  { name: 'Zure Pater Easy', style: 'Lichte sour', year: '2023', rating: 3.62, url: 'https://untappd.com/b/bierstekers-zure-pater-easy/4567234', cat: 'zuur' },
  { name: 'Zure Pater H', style: 'Hoppige sour', year: '2023', rating: 3.74, url: 'https://untappd.com/b/bierstekers-zure-pater-h/4567235', cat: 'zuur' },
  { name: 'Bierstekers Zure', style: 'Sour blend', year: '2021', rating: 3.66, url: 'https://untappd.com/b/bierstekers-zure/4567236', cat: 'zuur' },

  { name: 'Bierstekers Ode Lmbk', style: 'Lambik blend', year: '2022', rating: 3.92, url: 'https://untappd.com/b/bierstekers-ode-lmbk/4567240', cat: 'lambic' },
  { name: 'Wit Schaerbeekse Kriek', style: 'Witbier × kriek lambic', year: '2023', rating: 3.81, url: 'https://untappd.com/b/bierstekers-wit-schaerbeekse-kriek/4567241', cat: 'lambic' },

  { name: 'Bierstekers Zwart', style: 'Donkere blend', year: '2021', rating: 3.78, url: 'https://untappd.com/b/bierstekers-zwart/4567250', cat: 'donker' },
  { name: 'Bierstekers Zwart Smoked', style: 'Gerookt zwart', year: '2022', rating: 3.83, url: 'https://untappd.com/b/bierstekers-zwart-smoked/4567251', cat: 'donker' },
  { name: 'Bierstekers Zwart Odd Bruin', style: 'Oud bruin × zwart', year: '2023', rating: 3.88, url: 'https://untappd.com/b/bierstekers-zwart-odd-bruin/4567252', cat: 'donker' },

  { name: 'Bierstekers Wit', style: 'Witbier blend', year: '2021', rating: 3.55, url: 'https://untappd.com/b/bierstekers-wit/4567260', cat: 'wit' },
  { name: 'Bierstekers Wit Zuur', style: 'Sour witbier', year: '2022', rating: 3.69, url: 'https://untappd.com/b/bierstekers-wit-zuur/4567261', cat: 'wit' },
];

const BLOG_FILTERS: { id: BlogCat; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'belgisch', label: 'Belgisch' },
  { id: 'sour', label: 'Sour & Lambic' },
  { id: 'donker', label: 'Donker' },
  { id: 'speciaal', label: 'Speciaal' },
];

const BLEND_FILTERS: { id: BlendCat; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'zuur', label: 'Zuur' },
  { id: 'lambic', label: 'Lambic' },
  { id: 'donker', label: 'Donker' },
  { id: 'wit', label: 'Wit & Licht' },
];

const CARD_TINTS = [
  { bg: 'hsl(var(--primary-light))', emoji: '🍺' },
  { bg: 'hsl(var(--secondary-light))', emoji: '🌾' },
  { bg: 'hsl(var(--tertiary-light))', emoji: '🍻' },
];

export default function Archief() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'blog' | 'blends'>('blog');
  const [blogCat, setBlogCat] = useState<BlogCat>('all');
  const [blendCat, setBlendCat] = useState<BlendCat>('all');

  const visibleBlog = useMemo(
    () => (blogCat === 'all' ? BLOG : BLOG.filter(b => b.cat === blogCat)),
    [blogCat],
  );
  const visibleBlends = useMemo(
    () => (blendCat === 'all' ? BLENDS : BLENDS.filter(b => b.cat === blendCat)),
    [blendCat],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 py-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}
          >
            <Archive size={12} /> {t('Archief')}
          </span>
          <h1
            className="font-display mt-3 text-foreground"
            style={{ fontWeight: 900, fontSize: '36px', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {t('Alles bewaard')}
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground max-w-[640px]">
            {t('De originele blogposts van missbaxelsbeers.com én alle Bierstekers blends — voor altijd bewaard.')}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-5 grid grid-cols-2">
          {([
            { id: 'blog', label: 'MissBaxel\'s blog', Icon: BookOpen, count: BLOG.length, color: 'hsl(var(--primary))', light: 'hsl(var(--primary-light))' },
            { id: 'blends', label: 'Bierstekers blends', Icon: FlaskConical, count: BLENDS.length, color: 'hsl(var(--tertiary))', light: 'hsl(var(--tertiary-light))' },
          ] as const).map(({ id, label, Icon, count, color, light }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center justify-center gap-2 py-3.5 transition-colors"
                style={{
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  background: active ? light : 'transparent',
                  color: active ? color : 'hsl(var(--muted-foreground))',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <Icon size={15} />
                <span>{t(label)}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                  style={{
                    background: active ? color : 'hsl(var(--muted))',
                    color: active ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filter pills + content */}
      <section className="max-w-[1200px] mx-auto px-5 py-6">
        {tab === 'blog' ? (
          <>
            <FilterPills<BlogCat>
              filters={BLOG_FILTERS}
              active={blogCat}
              onChange={setBlogCat}
              accent="primary"
            />

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleBlog.map((post, i) => {
                const tint = CARD_TINTS[i % CARD_TINTS.length];
                return (
                  <a
                    key={post.slug}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-card border border-border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary-mid))')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                  >
                    <div
                      className="h-[72px] flex items-center justify-center text-3xl"
                      style={{ background: tint.bg }}
                    >
                      {tint.emoji}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: 'hsl(var(--primary-light))', color: '#27500A' }}
                        >
                          {post.date}
                        </span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </div>
                      <h3 className="font-display mt-2 text-foreground" style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.3 }}>
                        {post.title}
                      </h3>
                      <div className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {post.style}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <FilterPills<BlendCat>
              filters={BLEND_FILTERS}
              active={blendCat}
              onChange={setBlendCat}
              accent="tertiary"
            />

            <div className="mt-5 flex flex-col gap-2">
              {visibleBlends.map((b, i) => (
                <a
                  key={b.name}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-card border border-border px-4 py-3 transition-all hover:translate-x-[2px]"
                  style={{ borderRadius: 10 }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--tertiary))')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <div
                    className="font-display select-none shrink-0 tabular-nums"
                    style={{ fontWeight: 900, fontSize: '34px', lineHeight: 1, color: 'hsl(var(--tertiary-light))', minWidth: 44, textAlign: 'center' }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-foreground truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{b.style} · {b.year}</div>
                  </div>
                  <div className="shrink-0 inline-flex items-center gap-1" style={{ color: 'hsl(var(--tertiary))' }}>
                    <Star size={13} fill="currentColor" />
                    <span className="font-display tabular-nums" style={{ fontWeight: 700, fontSize: '16px' }}>
                      {b.rating.toFixed(2)}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <p className="mt-5 text-[11px] text-muted-foreground italic">
              {t('Scores via Untappd · klik om de pagina te openen.')}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function FilterPills<T extends string>({
  filters,
  active,
  onChange,
  accent,
}: {
  filters: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  accent: 'primary' | 'tertiary';
}) {
  const { t } = useLanguage();
  const activeBg = accent === 'primary' ? 'hsl(var(--primary-light))' : 'hsl(var(--tertiary-light))';
  const activeColor = accent === 'primary' ? '#27500A' : 'hsl(var(--tertiary))';
  const activeBorder = accent === 'primary' ? 'hsl(var(--primary-mid))' : 'hsl(var(--tertiary))';

  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map(f => {
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors"
            style={{
              borderColor: isActive ? activeBorder : 'hsl(var(--border))',
              background: isActive ? activeBg : 'transparent',
              color: isActive ? activeColor : 'hsl(var(--muted-foreground))',
            }}
          >
            {t(f.label)}
          </button>
        );
      })}
    </div>
  );
}
