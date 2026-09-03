import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHOLARSHIPS, TIPS } from "../data/scholarships";
import { computeCatalogCounts } from "../lib/catalog-counts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const counts = computeCatalogCounts(SCHOLARSHIPS, TIPS);
const out = join(root, "data/counts.json");
writeFileSync(out, `${JSON.stringify(counts, null, 2)}\n`);
console.log(`wrote ${out}`, counts);
