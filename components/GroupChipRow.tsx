import Link from "next/link";
import { studentLandingChips } from "@/lib/student-landings";

export function GroupChipRow({ className = "" }: { className?: string }) {
  const chips = studentLandingChips();
  if (chips.length === 0) return null;
  return (
    <nav className={className} aria-label="קבוצות חיפוש">
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.id}>
            <Link
              href={chip.href}
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-3 text-sm text-ink hover:border-forest"
            >
              {chip.labelHe}
              <span className="me-1 text-ink-soft"> · {chip.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
