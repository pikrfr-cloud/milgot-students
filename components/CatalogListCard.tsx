import Link from "next/link";
import { HeWithEn } from "@/components/HeWithEn";
import { ScholarshipFaceChips } from "@/components/ScholarshipFaceChips";
import { scholarshipPagePath } from "@/lib/catalog-routes";
import type { Scholarship } from "@/lib/types";

export function CatalogListCard({ scholarship }: { scholarship: Scholarship }) {
  return (
    <li className="rounded-2xl border border-line bg-card p-4">
      <Link
        href={scholarshipPagePath(scholarship.id)}
        className="font-display text-xl text-forest-deep underline-offset-4 hover:underline"
      >
        <HeWithEn text={scholarship.nameHe} />
      </Link>
      <p className="mt-1 text-sm text-ink-soft">
        <HeWithEn text={scholarship.funderHe} />
      </p>
      <ScholarshipFaceChips scholarship={scholarship} className="mt-3" />
    </li>
  );
}
