import { useEffect, useMemo, useState, useRef } from 'react';
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
  align?: 'left' | 'right';
}

export default function SearchableSelect({
  value = '',
  onSelect,
  options,
  placeholder = 'Seleccionar',
  disabled = false,
  color,
  align = 'left',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full h-[30px] justify-between px-2.5 font-normal hover:text-foreground text-foreground transition-all duration-200 outline-none border-0',
          !value && 'text-foreground/60',
          disabled && 'opacity-50 cursor-not-allowed',
          color === 'morado'
            ? value
              ? 'peer cursor-pointer appearance-none rounded-sm bg-amber-100 text-amber-950 font-bold py-1 pl-2.5 pr-7 text-xs outline-none transition focus:ring-2 focus:ring-amber-500'
              : 'peer cursor-pointer appearance-none rounded-sm bg-blue-100/60 text-gray-800 hover:bg-blue-200/60 py-1 pl-2.5 pr-7 text-xs font-semibold shadow-[inset_0_1px_2px_rgb(15_23_42_/0.05)] outline-none transition focus:ring-2 focus:ring-amber-500'
            : 'ring-primary/40 bg-primaryLight/20 hover:bg-primary/20 hover:ring-primaryLight'
        )}
      >
        <span className="truncate flex items-center gap-1.5 min-w-0 max-w-[135px]">
          {disabled && (
            <Lock className={cn('h-3 w-3 shrink-0', color === 'morado' ? 'text-primaryDark' : 'text-primary')} />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={cn('ml-2 h-4 w-4 shrink-0 transition-transform', value ? 'text-amber-800' : 'text-gray-600', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 w-[320px] max-w-[90vw] rounded-xl border border-gray-200 bg-white p-2 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50/70 border border-blue-100 px-2.5 py-1.5">
            <Search className="h-4 w-4 text-[#1a355b] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full border-none bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 && (
              <div className="p-3 text-xs text-gray-400 text-center">No se encontraron resultados.</div>
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
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-blue-100/70 text-[#1a355b] font-bold'
                      : 'text-gray-700 hover:bg-slate-50 hover:text-[#1a355b]'
                  )}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-[#1a355b]',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate flex-1" title={option.label}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
