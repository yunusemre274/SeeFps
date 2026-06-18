/**
 * SeeFps — NeonCombobox (Arama Destekli Dropdown Selection Box)
 *
 * Matrix temalı, arama/filtreleme destekli açılır seçim kutusu.
 * shadcn/ui Command (cmdk) + Popover pattern kullanır.
 *
 * Kullanım:
 * <NeonCombobox
 *   label="CPU / Processor"
 *   placeholder="CPU seçin..."
 *   searchPlaceholder="CPU ara..."
 *   emptyMessage="CPU bulunamadı."
 *   options={cpuNames}
 *   value={selectedCpu}
 *   onChange={setSelectedCpu}
 * />
 *
 * Görev 1.2 — Slider yerine geçen Dropdown Selection Box bileşeni.
 */

import * as React from "react";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface NeonComboboxProps {
  /** Dropdown üstündeki label metni */
  label: string;
  /** Tetikleyici butonun placeholder metni */
  placeholder?: string;
  /** Arama kutusunun placeholder metni */
  searchPlaceholder?: string;
  /** Sonuç bulunamadığında gösterilecek mesaj */
  emptyMessage?: string;
  /** Seçenek listesi (string dizisi) */
  options: string[];
  /** Seçili değer */
  value: string;
  /** Değer değiştiğinde çağrılacak callback */
  onChange: (value: string) => void;
  /** Bileşen devre dışı mı? */
  disabled?: boolean;
}

export function NeonCombobox({
  label,
  placeholder = "Seçim yapın...",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
  options,
  value,
  onChange,
  disabled = false,
}: NeonComboboxProps) {
  const [open, setOpen] = useState(false);

  // Seçili değerin kısaltılmış gösterimi (uzun metinler için)
  const displayValue = useMemo(() => {
    if (!value) return null;
    return value.length > 40 ? value.slice(0, 37) + "..." : value;
  }, [value]);

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block font-mono text-xs uppercase tracking-widest text-primary/70">
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            aria-label={`${label} seçin`}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between",
              "border border-primary/30 bg-background/60 backdrop-blur-sm",
              "px-4 py-3 text-left font-mono text-sm",
              "transition-all duration-200",
              "hover:border-primary/60 hover:bg-background/80",
              "focus:outline-none focus:neon-border",
              "disabled:cursor-not-allowed disabled:opacity-40",
              open && "neon-border",
            )}
          >
            {displayValue ? (
              <span className="text-foreground neon-text truncate">{displayValue}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-primary/50" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-0",
            "border-primary/30 bg-card/95 backdrop-blur-md",
            "shadow-[0_0_20px_oklch(0.82_0.24_142/0.15)]",
          )}
          align="start"
        >
          <Command
            className="bg-transparent"
            filter={(value, search) => {
              // Büyük/küçük harf duyarsız, Türkçe karakter uyumlu arama
              const normalizedValue = value.toLocaleLowerCase("tr");
              const normalizedSearch = search.toLocaleLowerCase("tr");
              if (normalizedValue.includes(normalizedSearch)) return 1;
              return 0;
            }}
          >
            <CommandInput
              placeholder={searchPlaceholder}
              className="font-mono text-sm text-primary placeholder:text-muted-foreground"
            />
            <CommandList className="max-h-[240px] scrollbar-thin">
              <CommandEmpty className="py-4 text-center font-mono text-xs text-muted-foreground">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer font-mono text-sm transition-colors",
                      "aria-selected:bg-primary/10 aria-selected:text-primary",
                      value === option && "text-primary",
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 text-primary",
                        value === option ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Seçili değer alt gösterimi */}
      {value && (
        <div className="font-mono text-[10px] text-primary/50 truncate">
          &gt; {value}
        </div>
      )}
    </div>
  );
}
