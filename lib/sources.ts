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

const OFFICIAL_HOSTS = new Set([
  "che.org.il",
  "cua.org.il",
  "www.cua.org.il",
  "perach.org.il",
  "www.perach.org.il",
  "kolzchut.org.il",
  "www.kolzchut.org.il",
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

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOfficialSourceUrl(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  const bare = host.replace(/^www\./, "");
  if (UNOFFICIAL_HOSTS.has(host) || UNOFFICIAL_HOSTS.has(bare)) return false;
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
