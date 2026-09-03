#!/usr/bin/env tsx
import { assertCityExport } from "../lib/assert-city-export";
import { assertAnalyticsExport } from "../lib/assert-analytics-export";

assertCityExport();
assertAnalyticsExport();
console.log("city export: no 404 HTML; Tel Aviv–Yafo has ItemList JSON-LD");
console.log("analytics export: no plausible/umami script tags (env empty)");
