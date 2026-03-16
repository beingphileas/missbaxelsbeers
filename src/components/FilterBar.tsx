import { breweryTypes } from '@/data/breweries';

interface FilterBarProps {
  selectedProvince: string;
  selectedType: string;
  selectedStyle: string;
  provinces: string[];
  beerStyles: string[];
  onProvinceChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStyleChange: (v: string) => void;
}

const FilterBar = ({
  selectedProvince, selectedType, selectedStyle,
  provinces, beerStyles,
  onProvinceChange, onTypeChange, onStyleChange,
}: FilterBarProps) => {
  const selectClass =
    "h-9 px-3 bg-card border border-border/60 text-xs appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200";

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
      <select value={selectedProvince} onChange={e => onProvinceChange(e.target.value)} className={selectClass}>
        <option value="">Alle Provincies</option>
        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={selectedType} onChange={e => onTypeChange(e.target.value)} className={selectClass}>
        <option value="">Alle Types</option>
        {breweryTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={selectedStyle} onChange={e => onStyleChange(e.target.value)} className={selectClass}>
        <option value="">Alle Stijlen</option>
        {beerStyles.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
};

export default FilterBar;
