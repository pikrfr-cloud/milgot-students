"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { normalizeCityName } from "@/lib/cities";

const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70";

export function moveActiveIndex(current: number, length: number, delta: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, current + delta));
}

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
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-list`;

  const filtered = useMemo(() => {
    const n = value.trim();
    if (!n) return suggestions.slice(0, 10);
    const needle = normalizeCityName(n);
    return suggestions
      .filter((c) => normalizeCityName(c).includes(needle) || c.includes(n))
      .slice(0, 10);
  }, [value, suggestions]);

  const activeId = open && filtered.length > 0 ? `${id}-opt-${activeIndex}` : undefined;

  function selectCity(city: string) {
    onChange(city);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (open ? moveActiveIndex(i, filtered.length, 1) : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => moveActiveIndex(i, filtered.length, -1));
    } else if (e.key === "Home") {
      if (open && filtered.length) {
        e.preventDefault();
        setActiveIndex(0);
      }
    } else if (e.key === "End") {
      if (open && filtered.length) {
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
      }
    } else if (e.key === "Enter") {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        selectCity(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative"
      ref={wrapRef}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && wrapRef.current?.contains(next)) return;
        setOpen(false);
      }}
    >
      <input
        id={id}
        className={inputClass}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-labelledby={labelledBy}
        aria-activedescendant={activeId}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value || null);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-card shadow-lg"
        >
          {filtered.map((c, i) => (
            <li
              key={c}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`min-h-11 cursor-pointer px-3 py-2 text-right ${
                i === activeIndex ? "bg-paper-deep" : "hover:bg-paper-deep"
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => selectCity(c)}
            >
              {c}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
