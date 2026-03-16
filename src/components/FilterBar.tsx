import { provinces, breweryTypes, beerStyles, BreweryType } from '@/data/breweries';

interface FilterBarProps {
  selectedProvince: string;
  selectedType: string;
  selectedStyle: string;
  onProvinceChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStyleChange: (v: string) => void;
}

const FilterBar = ({
  selectedProvince, selectedType, selectedStyle,
  onProvinceChange, onTypeChange, onStyleChange,
}: FilterBarProps) => {
  const selectClass =
    "h-9 px-3 rounded-lg bg-card shadow-card text-sm border-none appearance-none cursor-pointer focus:shadow-active focus:outline-none transition-shadow duration-200";

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <select value={selectedProvince} onChange={e => onProvinceChange(e.target.value)} className={selectClass}>
        <option value="">All Provinces</option>
        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={selectedType} onChange={e => onTypeChange(e.target.value)} className={selectClass}>
        <option value="">All Types</option>
        {breweryTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={selectedStyle} onChange={e => onStyleChange(e.target.value)} className={selectClass}>
        <option value="">All Styles</option>
        {beerStyles.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
};

export default FilterBar;
