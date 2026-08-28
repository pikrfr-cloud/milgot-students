import type { Predicate, ProfileField } from "./types";
import { INSTITUTIONS } from "./institutions";

const LABELS: Record<string, string> = {
  ba: "תואר ראשון",
  ma: "תואר שני",
  phd: "תואר שלישי",
  teaching_certificate: "תעודת הוראה",
  practical_engineer: "הנדסאי",
  prep: "מכינה קדם-אקדמית",
  full: "היקף מלא (כ־60% ומעלה)",
  partial: "היקף חלקי",
  stem: "מדע, טכנולוגיה, הנדסה ומתמטיקה",
  engineering: "הנדסה",
  computer_science: "מדעי המחשב",
  exact_sciences: "מדעים מדויקים",
  life_sciences: "מדעי החיים",
  medicine: "רפואה",
  nursing: "סיעוד",
  health: "מקצועות בריאות",
  law: "משפטים",
  business: "מנהל עסקים / כלכלה",
  social_sciences: "מדעי החברה",
  humanities: "מדעי הרוח",
  education: "חינוך",
  arts: "אמנויות",
  design: "עיצוב",
  architecture: "אדריכלות",
  social_work: "עבודה סוציאלית",
  other: "אחר",
  very_low: "הכנסה נמוכה מאוד",
  low: "הכנסה נמוכה",
  lower_middle: "הכנסה בינונית-נמוכה",
  middle: "הכנסה בינונית",
  high: "הכנסה גבוהה",
  idf: "שירות צבאי (צה״ל)",
  national: "שירות לאומי",
  civil: "שירות אזרחי",
  none: "לא שירתתי",
  exempt: "פטור משירות",
  female: "אישה",
  male: "גבר",
  other_gender: "אחר / לא בינארי",
  jewish_general: "יהודי/יהודייה (כללי)",
  arab: "החברה הערבית",
  druze: "דרוזי/דרוזית",
  circassian: "צ׳רקסי/צ׳רקסית",
  bedouin: "החברה הבדואית",
  haredi: "החברה החרדית / בוגר/ת חינוך חרדי",
  ethiopian: "יוצא/ת אתיופיה",
  single_parent: "הורה עצמאי",
  orphan: "יתום/יתומה",
  large_family: "משפחה מרובת ילדים",
  married: "נשוי/נשואה",
  has_children: "יש ילדים",
  income_support: "הבטחת הכנסה",
  disability_pension: "קצבת נכות",
  alimony_assurance: "הבטחת מזונות",
  unemployment: "דמי אבטלה",
  other_bituach_leumi: "גמלה אחרת מביטוח לאומי",
  sports: "ספורט",
  leadership: "מנהיגות",
  research: "מחקר",
  community: "פעילות קהילתית בולטת",
  institution: "מוסד הלימודים",
  campus: "קמפוס",
  degreeLevel: "שלב התואר",
  yearOfStudy: "שנת לימוד",
  faculty: "פקולטה",
  fieldOfStudy: "תחום לימוד",
  average: "ממוצע ציונים",
  studyLoad: "היקף לימודים",
  cityOfResidence: "עיר מגורים",
  hometown: "עיר מוצא",
  peripheryResidence: "מגורים בפריפריה",
  peripheryHometown: "מוצא מפריפריה",
  age: "גיל",
  gender: "מגדר",
  familyFlags: "מצב משפחתי",
  employmentHours: "שעות עבודה",
  volunteerHoursPerYear: "שעות התנדבות",
  hasPerach: "פר״ח",
  willingToVolunteer: "נכונות להתנדב",
  outstanding: "פעילות בולטת",
  service: "שירות",
  combatRole: "שירות במערך לוחם",
  yearsSinceDischarge: "שנים מאז השחרור",
  reservistDaysLastYear: "ימי מילואים",
  loneSoldier: "חייל/ת בודד/ה",
  sectors: "שיוך קהילתי",
  isOleh: "עולה חדש/ה",
  yearsInIsrael: "שנים בארץ",
  hasDisability: "מוגבלות",
  incomeBand: "רמת הכנסה",
  socialBenefits: "גמלאות",
  firstGeneration: "דור ראשון להשכלה גבוהה",
  completedMechina: "סיום מכינה קדם-אקדמית",
};

const TYPE_LABELS: Record<string, string> = {
  need: "סיוע כלכלי",
  merit: "הצטיינות",
  volunteering: "התנדבות / חונכות",
  leadership: "מנהיגות",
  population: "אוכלוסייה ייעודית",
  periphery: "פריפריה",
  service: "שירות / מילואים",
  research: "מחקר",
  loan: "הלוואה",
};

export function fieldLabelHe(key: string): string {
  return LABELS[key] ?? TYPE_LABELS[key] ?? key;
}

export function scholarshipTypeLabel(key: string): string {
  return TYPE_LABELS[key] ?? key;
}

export function profileFieldLabel(field: ProfileField): string {
  return LABELS[field] ?? field;
}

function joinHe(values: string[]): string {
  return values.map((v) => {
    const inst = INSTITUTIONS.find((i) => i.id === v);
    return inst?.nameHe ?? fieldLabelHe(v);
  }).join(", ");
}

export function predicateLabelHe(pred: Predicate): string {
  if (pred.labelHe) return pred.labelHe;
  switch (pred.type) {
    case "institutionIn":
      return `לומד/ת ב: ${joinHe(pred.values)}`;
    case "institutionNotIn":
      return `לא במוסדות: ${joinHe(pred.values)}`;
    case "degreeLevelIn":
      return `שלב לימודים: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "yearOfStudyIn":
      return `שנת לימודים: ${pred.values.join(", ")}`;
    case "yearOfStudyMin":
      return `משנת לימודים ${pred.value} ומעלה`;
    case "yearOfStudyMax":
      return `עד שנת לימודים ${pred.value}`;
    case "fieldOfStudyIn":
      return `תחום לימוד: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "minAverage":
      return `ממוצע ${pred.value} לפחות`;
    case "studyLoadFull":
      return "היקף לימודים מלא (כ־60% ומעלה / 12 שעות שבועיות)";
    case "cityIn":
      return `מגורים ב: ${pred.values.join(", ")}`;
    case "periphery":
      return pred.of === "hometown"
        ? "מוצא מאזור עדיפות לאומית / פריפריה"
        : pred.of === "either"
          ? "מגורים או מוצא בפריפריה"
          : "מגורים באזור עדיפות לאומית / פריפריה";
    case "incomeAtMost":
      return `מצב כלכלי עד ${fieldLabelHe(pred.value)}`;
    case "hasSocialBenefit":
      return "קבלת גמלה / סיוע מסוציאלי";
    case "serviceIn":
      return `שירות: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "combatRole":
      return pred.value === false ? "לא שירות לוחם" : "שירות במערך לוחם / תומך לחימה";
    case "yearsSinceDischargeMax":
      return `עד ${pred.value} שנים מסיום השירות`;
    case "reservistDaysMin":
      return `לפחות ${pred.value} ימי מילואים בשנה האחרונה`;
    case "loneSoldier":
      return "חייל/ת בודד/ה";
    case "genderIn":
      return `מגדר: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "sectorIn":
      return `קהילה: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "isOleh":
      return pred.value === false ? "אינו/ה עולה" : "עולה / סטטוס עולה";
    case "yearsInIsraelMax":
      return `עד ${pred.value} שנים בארץ`;
    case "yearsInIsraelMin":
      return `לפחות ${pred.value} שנים בארץ`;
    case "hasDisability":
      return pred.value === false ? "ללא מוגבלות מוכרת" : "מוגבלות מוכרת";
    case "familyFlagIn":
      return pred.values.map(fieldLabelHe).join(" / ");
    case "maxEmploymentHours":
      return `עד ${pred.value} שעות עבודה בשבוע`;
    case "minVolunteerHours":
      return `לפחות ${pred.value} שעות התנדבות בשנה`;
    case "willingToVolunteer":
      return "נכונות להתנדבות / מעורבות חברתית במסגרת המלגה";
    case "hasPerach":
      return "משתתף/ת בפר״ח";
    case "ageMin":
      return `גיל ${pred.value} ומעלה`;
    case "ageMax":
      return `גיל עד ${pred.value}`;
    case "outstandingIn":
      return `פעילות בולטת: ${pred.values.map(fieldLabelHe).join(" / ")}`;
    case "firstGeneration":
      return "דור ראשון להשכלה גבוהה";
    case "completedMechina":
      return pred.value === false ? "לא בוגר/ת מכינה" : "בוגר/ת מכינה קדם-אקדמית";
    default:
      return "קריטריון";
  }
}
