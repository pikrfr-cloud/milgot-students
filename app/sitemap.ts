import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/catalog-routes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries().map(({ url }) => ({ url }));
}
