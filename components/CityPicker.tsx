"use client";

import { useMemo, useState } from "react";
import { normalizeCityName } from "@/lib/cities";

const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70";

export function CityPicker({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  labelledBy,
}: {
  id: string;
  value: string;
  onChange: (city: string | null) => void;
  suggestions: readonly string[];
  placeholder?: string;
  labelledBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const n = value.trim();
    if (!n) return suggestions.slice(0, 10);
    const needle = normalizeCityName(n);
    return suggestions
      .filter((c) => normalizeCityName(c).includes(needle) || c.includes(n))
      .slice(0, 10);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        id={id}
        className={inputClass}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-labelledby={labelledBy}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value || null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-card shadow-lg"
        >
          {filtered.map((c) => (
            <li key={c} role="option" aria-selected={c === value}>
              <button
                type="button"
                className="min-h-11 w-full px-3 py-2 text-right hover:bg-paper-deep"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
