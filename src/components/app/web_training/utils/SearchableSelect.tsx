import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Lock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onSelect: (value: string) => void;
  options: Array<string | SearchableOption>;
  placeholder?: string;
  disabled?: boolean;
  color?: string;
}

export default function SearchableSelect({
  value = '',
  onSelect,
  options,
  placeholder = 'Seleccionar',
  disabled = false,
  color,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(
    () => options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt)),
    [options]
  );

  const selectedOption = normalizedOptions.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [normalizedOptions, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full justify-between px-3 font-normal hover:text-foreground text-foreground transition-all duration-200 outline-none border-0',
          !value && 'text-foreground/60',
          disabled && 'opacity-50 cursor-not-allowed',
          color === 'morado'
            ? 'peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition focus:ring-2 focus:ring-yellow-500 hover:bg-primary/40 focus:bg-primary/40'
            : 'ring-primary/40 bg-primaryLight/20 hover:bg-primary/20 hover:ring-primaryLight'
        )}
      >
        <span className="truncate flex items-center gap-2">
          {disabled && (
            <Lock className={cn('h-3 w-3', color === 'morado' ? 'text-primaryDark' : 'text-primary')} />
          )}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-70 rounded-md', color === 'morado' ? 'text-foreground' : 'text-primaryDark bg-secondaryLight')} />
      </Button>

      {open && (
        <div className={cn('absolute z-20 mt-2 2xl:w-[400px] w-[250px] rounded-sm border-2 bg-white p-2 shadow-lg', color === 'morado' ? 'border-primary' : 'border-primary')}>
          <div className="mb-2 flex items-center gap-2 rounded-sm bg-blue-100/60 px-2 py-2">
            <Search className="h-4 w-4 text-blue-900" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full border-none bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-[180px] overflow-y-auto">
            {filteredOptions.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No se encontraron resultados.</div>
            )}

            {filteredOptions.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSelect(isSelected ? '' : option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    color === 'morado'
                      ? 'bg-primaryDark/10 text-foreground hover:bg-primary/20'
                      : 'bg-primaryLight/20 text-primaryDark hover:bg-primaryLight/40', isSelected ? 'bg-primary/40' : ''
                  )}
                >
                  <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
