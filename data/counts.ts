import raw from "./counts.json";
import type { CatalogCounts } from "@/lib/catalog-counts";
import { studentCountsLine, studentCountsLineFull, studentTrustLine } from "@/lib/catalog-counts";

export const COUNTS: CatalogCounts = raw;

export { studentCountsLine, studentCountsLineFull, studentTrustLine };
export type { CatalogCounts };
