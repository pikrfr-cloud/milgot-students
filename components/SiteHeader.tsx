import Link from "next/link";

const links = [
  { href: "/", label: "ראשי" },
  { href: "/profile", label: "פרופיל" },
  { href: "/results", label: "הדוח שלי" },
  { href: "/catalog", label: "קטלוג" },
  { href: "/about", label: "אודות" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl text-forest-deep tracking-tight">מלגות לסטודנטים</span>
          <span className="hidden sm:inline text-xs text-ink-soft">דוח זכאות מלא</span>
        </Link>
        <nav aria-label="ראשי" className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
