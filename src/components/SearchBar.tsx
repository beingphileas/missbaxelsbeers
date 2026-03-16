import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search breweries, beers, flavors…"
        className="w-full h-10 pl-9 pr-4 rounded-lg bg-card shadow-card text-sm placeholder:text-muted-foreground focus:shadow-active focus:outline-none transition-shadow duration-200"
      />
    </div>
  );
};

export default SearchBar;
