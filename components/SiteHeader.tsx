"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HE } from "@/lib/i18n/he";

/** Short student nav — one path, not a portal. */
const links = [
  { href: "/chat", label: HE.nav.chat },
  { href: "/catalog", label: HE.nav.catalog },
  { href: "/closing", label: HE.nav.closing },
  { href: "/results", label: HE.nav.results },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 64);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`relative border-b border-line bg-card/90 backdrop-blur-sm sticky top-0 z-40 transition-transform ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-2">
          <span className="font-display text-xl text-forest-deep tracking-tight">{HE.siteName}</span>
        </Link>
        <button
          type="button"
          className="md:hidden min-h-11 min-w-11 rounded-full border border-line px-3 text-sm"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? HE.nav.close : HE.nav.menu}
        </button>
        <nav
          id="site-nav"
          aria-label="ראשי"
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col border-b border-line bg-card p-3 md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:p-0 text-sm`}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-11 items-center rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
