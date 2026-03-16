import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Zoek brouwerijen, bieren, smaken…"
        className="w-full h-11 pl-10 pr-4 rounded-xl bg-card shadow-card text-sm placeholder:text-muted-foreground/50 focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200"
      />
    </div>
  );
};

export default SearchBar;
