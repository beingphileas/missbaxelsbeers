import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Zoek brouwerijen, bieren, smaken…"
        className="w-full h-10 pl-10 pr-4 bg-card border border-border/60 text-sm placeholder:text-muted-foreground/40 focus:shadow-card focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
      />
    </div>
  );
};

export default SearchBar;
