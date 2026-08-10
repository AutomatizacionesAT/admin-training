import { useState } from 'react'
import { Check, ChevronsUpDown, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

export default function SearchableSelect({
  value,
  onSelect,
  options,
  placeholder,
  disabled = false,
  color
}) {
  const [open, setOpen] = useState(false)

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOption = normalizedOptions.find(
    (option) => option.value === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between px-3 font-normal ring-2 hover:text-foreground text-foreground transition-all duration-200',
            !value && 'text-foreground/60',
            disabled && 'opacity-50 cursor-not-allowed',
            color === "morado" ? 'ring-primaryDark/40 bg-primaryDark/20 hover:bg-primaryDark/20 hover:ring-primaryDark' : 'ring-primary/40 bg-primaryLight/20 hover:bg-primary/20 hover:ring-primaryLight',
          )}
        >
          <span className="truncate flex items-center gap-2">
            {disabled && <Lock className={cn("h-3 w-3", color === "morado" ? "text-primaryDark" : "text-primary")} />}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className={cn('ml-2 h-4 w-4 shrink-0 opacity-70 rounded-md', 
            color === "morado" ? 'text-primaryDark bg-primaryDark/20' : 'text-primaryDark bg-secondaryLight',)} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[var(--radix-popover-trigger-width)] p-1 border-2 shadow-lg shadow-red-900/5", color === "morado" ? 'border-primaryDark' : 'border-primary')}
        align="start"
      >
        <Command className="bg-background">
          <CommandInput
            placeholder="Buscar..."
            className="h-9 text-[hsl(var(--rojoOscuro))] placeholder:text-[hsl(var(--rojoOscuro))]"
          />
          <CommandList className="max-h-[180px]">
            <CommandEmpty className="p-3 text-sm text-foreground">
              No se encontraron resultados.
            </CommandEmpty>
            <CommandGroup>
              {normalizedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                  className={cn(
                    'cursor-pointer text-sm py-2.5',
                    'data-[selected=true]:text-background',
                    color === "morado" ? 'bg-primaryDark/20 text-primaryDark hover:bg-primaryDark/80 aria-selected:bg-primaryDark/80 data-[selected=true]:bg-primaryDark/80' :
                     'bg-primaryLight/20 text-primaryDark hover:bg-primaryLight/80 aria-selected:bg-primaryLight/80 data-[selected=true]:bg-primaryLight/80'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                      color === "morado" ? 'text-primaryDark' : 'text-primary'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
