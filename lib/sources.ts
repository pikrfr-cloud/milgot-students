import type { SourceLevel } from "./types";

/** Hosts that are news aggregators / commercial scholarship portals — not official. */
const UNOFFICIAL_HOSTS = new Set([
  "study.co.il",
  "www.study.co.il",
  "milgofa.co.il",
  "www.milgofa.co.il",
  "milgapo.co.il",
  "www.milgapo.co.il",
  "kikar.co.il",
  "www.kikar.co.il",
  "walla.co.il",
  "news.walla.co.il",
  "mekomi.walla.co.il",
  "jerusalemharedim.co.il",
  "www.jerusalemharedim.co.il",
  "ynet.co.il",
  "www.ynet.co.il",
  "mako.co.il",
  "www.mako.co.il",
]);

/** Rights encyclopedias — useful, but not a dedicated funder page. */
const SECONDARY_HOSTS = new Set(["kolzchut.org.il", "www.kolzchut.org.il"]);

const OFFICIAL_HOSTS = new Set([
  "che.org.il",
  "cua.org.il",
  "www.cua.org.il",
  "perach.org.il",
  "www.perach.org.il",
  "gruss.org.il",
  "www.gruss.org.il",
  "isef.org.il",
  "www.isef.org.il",
  "atidim.org",
  "www.atidim.org",
  "fidfimpact.org",
  "www.fidfimpact.org",
  "www.moshalprogram.org",
  "moshalprogram.org",
  "moshalprogram.org.il",
  "www.moshalprogram.org.il",
  "rhcf.org.il",
  "www.rhcf.org.il",
  "rothschildcp.com",
  "www.rothschildcp.com",
  "apps.rothschildcp.com",
  "ailim.org.il",
  "www.ailim.org.il",
  "ayalim.org.il",
  "www.ayalim.org.il",
  "villages.ayalim.org.il",
  "heznek.org",
  "www.heznek.org",
  "hias.org.il",
  "www.hias.org.il",
  "kkl.org.il",
  "www.kkl.org.il",
  "naamat.org.il",
  "www.naamat.org.il",
  "wizo.org.il",
  "www.wizo.org.il",
  "schulichleaders.co.il",
  "keren-kemach.org",
  "www.keren-kemach.org",
  "heznekleatid.org.il",
  "www.heznekleatid.org.il",
  "www.nuis.co.il",
  "nuis.co.il",
  "jerusalemfoundation.org",
  "www.jerusalemfoundation.org",
  "yeilat.co.il",
  "pais.co.il",
  "www.pais.co.il",
  "aluma.org.il",
  "www.aluma.org.il",
  "mushlam-frontend.wiz.digital.idf.il",
  "rashi.org.il",
  "www.rashi.org.il",
  "eyz.org.il",
  "www.eyz.org.il",
  "rng.org.il",
  "www.rng.org.il",
  "matnasbinyamin.co.il",
  "www.matnasbinyamin.co.il",
  "e4e.org.il",
  "www.e4e.org.il",
  "digitaler.cld.bz",
]);

const HOMEPAGE_PATHS = new Set(["", "/", "/he", "/en", "/he/", "/en/", "/home", "/home/", "/index.html"]);
const LANG_SEGMENTS = new Set(["he", "en", "he-il", "en-us", "pages", "page", "home", "index.html"]);

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function bareHost(host: string): string {
  return host.replace(/^www\./, "");
}

export function isOfficialSourceUrl(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  const bare = bareHost(host);
  if (UNOFFICIAL_HOSTS.has(host) || UNOFFICIAL_HOSTS.has(bare)) return false;
  if (SECONDARY_HOSTS.has(host) || SECONDARY_HOSTS.has(bare)) return false;
  if (
    bare === "gov.il" ||
    bare.endsWith(".gov.il") ||
    bare.endsWith(".ac.il") ||
    bare.endsWith(".muni.il") ||
    bare === "idf.il" ||
    bare.endsWith(".idf.il")
  ) {
    return true;
  }
  if (OFFICIAL_HOSTS.has(host) || OFFICIAL_HOSTS.has(bare)) return true;
  return false;
}

export function officialSourceUrls(urls: string[]): string[] {
  return urls.filter(isOfficialSourceUrl);
}

export function hasOfficialSource(urls: string[]): boolean {
  return urls.some(isOfficialSourceUrl);
}

function pathLooksLikeHomepage(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return HOMEPAGE_PATHS.has(pathname) || HOMEPAGE_PATHS.has(p);
}

/** Path segments that look like a real page, ignoring language/CMS prefixes. */
export function significantPathDepth(pathname: string): number {
  return pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => !LANG_SEGMENTS.has(seg.toLowerCase())).length;
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function gradeSourceUrl(url: string): SourceLevel {
  const host = hostnameOf(url);
  if (!host) return "indirect";
  const bare = bareHost(host);
  if (UNOFFICIAL_HOSTS.has(host) || UNOFFICIAL_HOSTS.has(bare)) return "indirect";
  if (SECONDARY_HOSTS.has(host) || SECONDARY_HOSTS.has(bare)) return "indirect";
  if (!isOfficialSourceUrl(url)) return "indirect";
  try {
    const path = new URL(url).pathname;
    if (pathLooksLikeHomepage(path) || significantPathDepth(path) <= 1) return "institution_site";
    return "official_page";
  } catch {
    return "indirect";
  }
}

const LEVEL_RANK: Record<SourceLevel, number> = {
  official_page: 3,
  institution_site: 2,
  indirect: 1,
};

export function bestSourceLevel(urls: string[]): SourceLevel {
  if (!urls.length) return "indirect";
  return urls.map(gradeSourceUrl).reduce((best, grade) =>
    LEVEL_RANK[grade] > LEVEL_RANK[best] ? grade : best,
  );
}

/** @deprecated Use bestSourceLevel */
export const bestSourceGrade = bestSourceLevel;

export function sourceLevelLabelHe(level: SourceLevel): string {
  switch (level) {
    case "official_page":
      return "דף מלגה רשמי";
    case "institution_site":
      return "אתר הארגון";
    default:
      return "מקור משני";
  }
}

/** @deprecated Use sourceLevelLabelHe */
export const sourceGradeLabelHe = sourceLevelLabelHe;
