import raw from "./counts.json";
import type { CatalogCounts } from "@/lib/catalog-counts";
import { studentCountsLine } from "@/lib/catalog-counts";

export const COUNTS: CatalogCounts = raw;

export { studentCountsLine };
export type { CatalogCounts };
