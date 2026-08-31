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
];

/** Canonical city name for matching (aliases + spelling variants). */
export function normalizeCityName(city: string): string {
  let s = city.trim().replace(/[־–—]/g, "-").replace(/\s+/g, " ");
  s = s.replace(/קרית/g, "קריית");
  s = s.replace(/\s*-\s*/g, "-");
  const compact = s.replace(/[-\s]/g, "");
  if (compact === "תלאביב" || compact === "תלאביביפו") return "תל אביב-יפו";
  if (compact === "מעלותתרשיחא") return "מעלות-תרשיחא";
  if (compact === "נצרתעילית") return "נוף הגליל";
  return s;
}

export function citiesMatch(a: string, b: string): boolean {
  return normalizeCityName(a) === normalizeCityName(b);
}

export function cityInList(city: string, values: string[]): boolean {
  const needle = normalizeCityName(city);
  return values.some((v) => normalizeCityName(v) === needle);
}

export function isPeripheryCity(city: string): boolean {
  return SOCIAL_PERIPHERY_CITIES.has(normalizeCityName(city.trim()));
}
