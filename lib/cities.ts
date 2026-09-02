/**
 * Social/geographic periphery localities for *private* funds (ISEF, Gruss, etc.).
 * Not a legal determination of national-priority areas (ייעוד 45/46).
 * Jerusalem, Ashdod, Hadera, Lod, Ramla, Yavne and similar central cities
 * are intentionally absent — they must not count as national-priority.
 */
const SOCIAL_PERIPHERY_CITIES = new Set([
  "באר שבע",
  "אילת",
  "דימונה",
  "ערד",
  "אופקים",
  "נתיבות",
  "שדרות",
  "קריית גת",
  "אשקלון",
  "ירוחם",
  "מצפה רמון",
  "שגב שלום",
  "רהט",
  "תל שבע",
  "חורה",
  "כסייפה",
  "לקיה",
  "ערערה בנגב",
  "קריית מלאכי",
  "קריית שמונה",
  "צפת",
  "טבריה",
  "עכו",
  "נהריה",
  "כרמיאל",
  "מעלות-תרשיחא",
  "שלומי",
  "חצור הגלילית",
  "בית שאן",
  "עפולה",
  "נצרת",
  "נצרת עילית",
  "נוף הגליל",
  "שפרעם",
  "סכנין",
  "טמרה",
  "מגדל העמק",
  "יקנעם",
  "יקנעם עילית",
  "קצרין",
  "מטולה",
  "קריית ים",
  "קריית אתא",
  "טירת כרמל",
  "אור עקיבא",
  "אריאל",
  "בית שמש",
  "אום אל-פחם",
  "באקה אל-גרביה",
  "טייבה",
  "טירה",
  "קלנסווה",
  "כפר קאסם",
  "דלית אל-כרמל",
  "עספיא",
  "מג'ד אל-כרום",
  "עראבה",
  "דיר אל-אסד",
  "כפר כנא",
  "ריינה",
  "טורעאן",
  "בועיינה-נוג'ידאת",
  "יפיע",
  "דבוריה",
  "כאבול",
  "ג'דיידה-מכר",
  "אעבלין",
  "כפר יאסיף",
  "פסוטה",
  "ג'ולס",
  "חורפיש",
  "בית ג'ן",
  "ירכא",
  "כיסרא-סמיע",
  "מסעדה",
  "בוקעאתא",
  "מג'דל שמס",
  "עין קיניה",
]);

export const CITY_SUGGESTIONS = [
  "תל אביב-יפו",
  "ירושלים",
  "חיפה",
  "ראשון לציון",
  "פתח תקווה",
  "אשדוד",
  "נתניה",
  "באר שבע",
  "בני ברק",
  "חולון",
  "רמת גן",
  "אשקלון",
  "רחובות",
  "בת ים",
  "בית שמש",
  "כפר סבא",
  "הרצליה",
  "חדרה",
  "מודיעין-מכבים-רעות",
  "לוד",
  "רמלה",
  "נצרת",
  "רעננה",
  "הוד השרון",
  "כפר יונה",
  "רהט",
  "נהריה",
  "עפולה",
  "עכו",
  "אילת",
  "טבריה",
  "קריית גת",
  "קריית שמונה",
  "צפת",
  "שדרות",
  "דימונה",
  "ערד",
  "אופקים",
  "נתיבות",
  "כרמיאל",
  "נוף הגליל",
  "שפרעם",
  "טמרה",
  "סכנין",
  "אום אל-פחם",
  "טייבה",
  "אור יהודה",
  "גבעתיים",
  "קריית אונו",
  "רמת השרון",
  "יבנה",
  "נס ציונה",
  "מעלה אדומים",
  "אריאל",
  "ביתר עילית",
  "מודיעין עילית",
  "קריית מלאכי",
  "קריית ים",
  "קריית אתא",
  "קריית ביאליק",
  "קריית מוצקין",
  "ראש העין",
  "עמק יזרעאל",
  "רמת הנגב",
  "מטה בנימין",
  "חבל מודיעין",
  "אפרת",
  "חוף השרון",
  "זבולון",
  "שומרון",
  "חבל יבנה",
  "בנימינה-גבעת עדה",
  "ג'יסר א-זרקא",
  "זכרון יעקב",
  "חוף הכרמל",
  "פורדיס",
  "פרדס חנה-כרכור",
  "עוספייה",
];

/** Compact key: strip hyphens, spaces, and gershayim so באר-שבע = באר שבע = ב"ש. */
export function compactCityKey(city: string): string {
  return city
    .trim()
    .replace(/[־–—]/g, "-")
    .replace(/קרית/g, "קריית")
    .replace(/[\"״׳'`]/g, "")
    .replace(/[-\s]/g, "");
}

const CITY_COMPACT_ALIASES: Record<string, string> = {
  תלאביב: "תל אביב-יפו",
  תלאביביפו: "תל אביב-יפו",
  מעלותתרשיחא: "מעלות-תרשיחא",
  נצרתעילית: "נוף הגליל",
  בארשבע: "באר שבע",
  בש: "באר שבע",
  ראשוןלציון: "ראשון לציון",
  ראשלצ: "ראשון לציון",
  פתחתקווה: "פתח תקווה",
  פתחתקוה: "פתח תקווה",
  פת: "פתח תקווה",
  עוספיה: "עספיא",
  עוספייה: "עספיא",
  עספיא: "עספיא",
  טירתהכרמל: "טירת כרמל",
  בנימינה: "בנימינה-גבעת עדה",
  גבעתעדה: "בנימינה-גבעת עדה",
  בנימינהגבעתעדה: "בנימינה-גבעת עדה",
  פרדסחנה: "פרדס חנה-כרכור",
  כרכור: "פרדס חנה-כרכור",
  פרדסחנהכרכור: "פרדס חנה-כרכור",
};

/** Canonical city name for matching (aliases + spelling variants). */
export function normalizeCityName(city: string): string {
  let s = city.trim().replace(/[־–—]/g, "-").replace(/\s+/g, " ");
  s = s.replace(/קרית/g, "קריית");
  s = s.replace(/\s*-\s*/g, "-");
  s = s.replace(/[\"״׳'`]/g, "");
  const compact = compactCityKey(s);
  if (CITY_COMPACT_ALIASES[compact]) return CITY_COMPACT_ALIASES[compact];
  return s;
}

export function citiesMatch(a: string, b: string): boolean {
  return compactCityKey(normalizeCityName(a)) === compactCityKey(normalizeCityName(b));
}

export function cityInList(city: string, values: string[]): boolean {
  return values.some((v) => citiesMatch(city, v));
}

export function isPeripheryCity(city: string): boolean {
  const canonical = normalizeCityName(city.trim());
  if (SOCIAL_PERIPHERY_CITIES.has(canonical)) return true;
  const needle = compactCityKey(canonical);
  for (const listed of SOCIAL_PERIPHERY_CITIES) {
    if (compactCityKey(listed) === needle) return true;
  }
  return false;
}

export function isTelAvivCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return normalizeCityName(city) === "תל אביב-יפו";
}

export function isJerusalemCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return normalizeCityName(city) === "ירושלים";
}

export function cityNeedsNeighborhood(city: string | null | undefined): boolean {
  return isTelAvivCity(city) || isJerusalemCity(city);
}

/** South Tel Aviv / Jaffa quarters named on the municipal scholarship page. */
export const TEL_AVIV_SOUTH_NEIGHBORHOODS = [
  "שפירא",
  "קריית שלום",
  "התקווה",
  "יפו",
  "נווה עופר",
  "כפר שלם",
  "עזרא",
  "ארגזים",
  "פלורנטין",
  "נווה שאנן",
  "יד אליהו",
  "גבעת התמרים",
  "עג'מי",
  "גבעת עלייה",
  "נווה גולן",
];

export const JERUSALEM_NEIGHBORHOOD_SUGGESTIONS = [
  "קטמון",
  "רחביה",
  "טלביה",
  "בית הכרם",
  "גילה",
  "פסגת זאב",
  "רמות",
  "עין כרם",
  "ארנונה",
  "בקעה",
  "המושבה הגרמנית",
  "נחלאות",
  "קריית יובל",
  "קריית מנחם",
  "הר נוף",
  "בית וגן",
  "גבעת שאול",
];

export function neighborhoodMatches(name: string, values: string[]): boolean {
  const needle = normalizeCityName(name);
  return values.some((v) => normalizeCityName(v) === needle);
}
