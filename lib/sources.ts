import type { SourceGrade } from "./types";

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
  "www.moshalprogram.org",
  "moshalprogram.org",
  "rhcf.org.il",
  "www.rhcf.org.il",
  "ailim.org.il",
  "www.ailim.org.il",
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
]);

const HOMEPAGE_PATHS = new Set(["", "/", "/he", "/en", "/he/", "/en/", "/home", "/home/", "/index.html"]);

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

export function gradeSourceUrl(url: string): SourceGrade {
  const host = hostnameOf(url);
  if (!host) return "secondary";
  const bare = bareHost(host);
  if (UNOFFICIAL_HOSTS.has(host) || UNOFFICIAL_HOSTS.has(bare)) return "secondary";
  if (SECONDARY_HOSTS.has(host) || SECONDARY_HOSTS.has(bare)) return "secondary";
  if (!isOfficialSourceUrl(url)) return "secondary";
  try {
    const path = new URL(url).pathname;
    if (pathLooksLikeHomepage(path)) return "homepage";
    return "dedicated";
  } catch {
    return "secondary";
  }
}

const GRADE_RANK: Record<SourceGrade, number> = {
  dedicated: 3,
  homepage: 2,
  secondary: 1,
};

export function bestSourceGrade(urls: string[]): SourceGrade {
  if (!urls.length) return "secondary";
  return urls.map(gradeSourceUrl).reduce((best, grade) =>
    GRADE_RANK[grade] > GRADE_RANK[best] ? grade : best,
  );
}

export function sourceGradeLabelHe(grade: SourceGrade): string {
  switch (grade) {
    case "dedicated":
      return "דף מלגה רשמי";
    case "homepage":
      return "אתר הארגון";
    default:
      return "מקור משני";
  }
}
