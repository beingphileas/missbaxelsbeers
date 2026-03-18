import { useState } from 'react';
import { Search, X, SlidersHorizontal, Map, List, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { breweryTypes } from '@/data/breweries';
import { useLanguage } from '@/hooks/useLanguage';

interface GlassSearchOverlayProps {
  search: string;
  onSearchChange: (v: string) => void;
  province: string;
  type: string;
  style: string;
  provinces: string[];
  beerStyles: string[];
  onProvinceChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  resultCount: number;
  isLoading: boolean;
  view: 'split' | 'map' | 'list';
  onViewChange: (v: 'split' | 'map' | 'list') => void;
}

export default function GlassSearchOverlay({
  search, onSearchChange,
  province, type, style,
  provinces, beerStyles,
  onProvinceChange, onTypeChange, onStyleChange,
  resultCount, isLoading,
  view, onViewChange,
}: GlassSearchOverlayProps) {
  const { t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = !!(province || type || style);
  const activeCount = [province, type, style].filter(Boolean).length;

  const clearAll = () => {
    onSearchChange('');
    onProvinceChange('');
    onTypeChange('');
    onStyleChange('');
  };

  const selectClass =
    "h-9 px-3 bg-white/10 border border-white/20 text-foreground text-xs rounded-lg appearance-none cursor-pointer backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all duration-200";

  const viewItems = [
    { key: 'split' as const, icon: <LayoutGrid size={13} />, label: 'Split' },
    { key: 'map' as const, icon: <Map size={13} />, label: t('Kaart') },
    { key: 'list' as const, icon: <List size={13} />, label: t('Lijst') },
  ];

  return (
    <div className="absolute top-3 left-3 right-3 md:left-5 md:top-5 md:right-auto md:w-[360px] z-20 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pointer-events-auto rounded-2xl border border-white/20 bg-background/65 backdrop-blur-xl ring-1 ring-white/[0.08] overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px -12px rgba(218,165,32,0.08)' }}
      >
        {/* Search row */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Zoek brouwerijen, bieren…"
            className="w-full h-11 md:h-12 pl-10 pr-16 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {(search || hasFilters) && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors"
                title="Wis alles"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-1.5 rounded-lg transition-colors relative ${filtersOpen ? 'bg-accent/20 text-accent' : 'hover:bg-foreground/10 text-muted-foreground'}`}
              title="Filters"
            >
              <SlidersHorizontal size={14} />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-3 pt-1 space-y-2 border-t border-white/10">
                <select value={province} onChange={e => onProvinceChange(e.target.value)} className={selectClass + ' w-full'}>
                  <option value="">Alle Provincies</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={type} onChange={e => onTypeChange(e.target.value)} className={selectClass + ' w-full'}>
                  <option value="">Alle Types</option>
                  {breweryTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={style} onChange={e => onStyleChange(e.target.value)} className={selectClass + ' w-full'}>
                  <option value="">Alle Stijlen</option>
                  {beerStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer: count + view toggles (visible on all screens) */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-white/10 bg-foreground/[0.03]">
          <p className="text-[10px] md:text-[11px] text-muted-foreground tabular-nums">
            {isLoading ? 'Laden…' : `${resultCount} brouwerijen`}
          </p>
          <div className="flex items-center gap-0.5 bg-foreground/5 rounded-lg p-0.5">
            {viewItems.map(item => (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  view === item.key
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
