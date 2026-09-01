"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProfileField, StudentProfile } from "@/lib/types";
import {
  DEGREE_LEVELS,
  FAMILY_FLAGS,
  FIELD_GROUPS,
  GENDERS,
  HOUSEHOLD_INCOME_BANDS,
  OUTSTANDING,
  SECTORS,
  SERVICE_TYPES,
} from "@/lib/types";
import { INSTITUTIONS_FOR_SELECT } from "@/lib/institutions";
import {
  CITY_SUGGESTIONS,
  JERUSALEM_NEIGHBORHOOD_SUGGESTIONS,
  TEL_AVIV_SOUTH_NEIGHBORHOODS,
  cityNeedsNeighborhood,
  isJerusalemCity,
  isTelAvivCity,
} from "@/lib/cities";
import { fieldLabelHe, formatProfileValueHe } from "@/lib/labels";
import {
  downloadProfileJson,
  loadProfile,
  parseImportedProfile,
  saveProfile,
} from "@/lib/profile-storage";
import { FIELD_STEP, HIGH_IMPACT_FIELDS, WIZARD_FIELDS, fieldDomId } from "@/lib/profile-fields";
import { HOUSEHOLD_INCOME_HINT_HE, deriveIncomeBand } from "@/lib/income";
import { CityPicker } from "@/components/CityPicker";
import { Field } from "@/components/Field";
import { HeWithEn } from "@/components/HeWithEn";

const DEMO_PERIPHERY_TAU: StudentProfile = {
  institution: "tau",
  degreeLevel: "ba",
  yearOfStudy: 1,
  fieldOfStudy: "social_sciences",
  cityOfResidence: "שדרות",
  hometown: "שדרות",
  peripheryResidence: true,
  peripheryHometown: true,
  service: "idf",
  yearsSinceDischarge: 1,
  combatRole: false,
  willingToVolunteer: true,
  householdSize: 4,
  householdIncomeBand: "band_8_15k",
  studyLoad: "full",
  age: 23,
  gender: "female",
  sectors: ["jewish_general"],
  isOleh: false,
  hasDisability: false,
  firstGeneration: true,
  completedMechina: false,
};

const STEPS = [
  { id: "studies", title: "לימודים" },
  { id: "place", title: "מגורים" },
  { id: "personal", title: "רקע אישי" },
  { id: "service", title: "שירות" },
  { id: "community", title: "קהילה ומצב כלכלי" },
  { id: "review", title: "סיכום" },
];

const tapBtn =
  "min-h-11 min-w-11 inline-flex items-center justify-center rounded-full px-5 py-2";
const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70";

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 min-h-11 text-sm text-ink-soft underline underline-offset-4"
    >
      לא יודע/ת — דלג
    </button>
  );
}

function toggleFlag<T>(current: T[] | null | undefined, value: T, checked: boolean): T[] | null {
  const list = current ?? [];
  const next = checked ? [...list, value] : list.filter((x) => x !== value);
  return next.length ? next : null;
}

function servedMilitary(service: StudentProfile["service"]): boolean {
  return service === "idf" || service === "national";
}

function validationHints(profile: StudentProfile): string[] {
  const hints: string[] = [];
  const age = profile.age;
  const degree = profile.degreeLevel;
  const year = profile.yearOfStudy;
  if (age != null && degree) {
    if (degree === "ba" && age < 17) hints.push("גיל נמוך יחסית לתואר ראשון — בדקו שהשנה והתואר נכונים.");
    if (degree === "ma" && age < 20) hints.push("גיל נמוך יחסית לתואר שני — בדקו שהשנה והתואר נכונים.");
    if (degree === "phd" && age < 22) hints.push("גיל נמוך יחסית לדוקטורט — בדקו שהשנה והתואר נכונים.");
  }
  if (year != null && degree) {
    if (degree === "ba" && year > 4 && profile.fieldOfStudy !== "medicine") {
      hints.push("שנת לימוד גבוהה מהרגיל לתואר ראשון (חוץ מרפואה).");
    }
    if (degree === "ma" && year > 3) hints.push("שנת לימוד גבוהה מהרגיל לתואר שני.");
    if (degree === "phd" && year > 8) hints.push("שנת לימוד גבוהה מהרגיל לדוקטורט.");
    if (degree === "teaching_certificate" && year > 3) hints.push("שנת לימוד גבוהה מהרגיל לתעודת הוראה.");
    if (degree === "practical_engineer" && year > 3) hints.push("שנת לימוד גבוהה מהרגיל להנדסאים.");
    if (degree === "prep" && year > 2) hints.push("שנת לימוד גבוהה מהרגיל למכינה.");
  }
  if (
    profile.reservistDaysLastYear != null &&
    profile.reservistDaysLastYear > 0 &&
    profile.service !== "idf"
  ) {
    hints.push("ימי מילואים רלוונטיים בעיקר אחרי שירות צה״ל.");
  }
  return hints;
}

export function ProfileWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [ready, setReady] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const appliedFocus = useRef(false);
  const focus = searchParams.get("focus") as ProfileField | null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile(profile);
  }, [profile, ready]);

  useEffect(() => {
    if (!ready || !focus || appliedFocus.current) return;
    appliedFocus.current = true;
    const target = FIELD_STEP[focus];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from a results card
    if (target != null) setStep(target);
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      document.getElementById(fieldDomId(focus))?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
      router.replace("/profile/", { scroll: false });
    });
  }, [focus, ready, router]);

  const selectedInstitution = useMemo(
    () => INSTITUTIONS_FOR_SELECT.find((i) => i.id === profile.institution),
    [profile.institution],
  );

  const showServiceDetails = servedMilitary(profile.service);
  const showReservist = profile.service === "idf";
  const showYearsInIsrael = profile.isOleh === true || profile.sectors?.includes("ethiopian");
  const showMechina = profile.degreeLevel !== "phd";
  const showDegreeAverage = Number(profile.yearOfStudy) !== 1 && profile.degreeLevel !== "prep";
  const needNeighborhood = cityNeedsNeighborhood(profile.cityOfResidence);
  const neighborhoodSuggestions = isTelAvivCity(profile.cityOfResidence)
    ? TEL_AVIV_SOUTH_NEIGHBORHOODS
    : isJerusalemCity(profile.cityOfResidence)
      ? JERUSALEM_NEIGHBORHOOD_SUGGESTIONS
      : [];
  const derivedIncome = deriveIncomeBand(profile.householdSize, profile.householdIncomeBand);
  const hints = validationHints(profile);

  function patch(partial: StudentProfile) {
    setProfile((p) => ({ ...p, ...partial }));
  }

  function goTo(nextStep: number) {
    setStep(nextStep);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function next() {
    goTo(Math.min(STEPS.length - 1, step + 1));
  }
  function back() {
    goTo(Math.max(0, step - 1));
  }

  function onServiceChange(value: StudentProfile["service"]) {
    const nextProfile: StudentProfile = { service: value };
    if (!servedMilitary(value)) {
      nextProfile.combatRole = null;
      nextProfile.yearsSinceDischarge = null;
      nextProfile.loneSoldier = null;
      nextProfile.reservistDaysLastYear = null;
    } else if (value !== "idf") {
      nextProfile.reservistDaysLastYear = null;
    }
    patch(nextProfile);
  }

  function onOlehChange(value: boolean | null) {
    patch({ isOleh: value, yearsInIsrael: value === true ? profile.yearsInIsrael : null });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        שלב {step + 1} מתוך {STEPS.length}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-display text-3xl text-forest-deep outline-none"
      >
        {STEPS[step].title}
      </h1>
      {process.env.NODE_ENV === "development" ? (
        <button
          type="button"
          className="mt-2 min-h-11 text-sm text-ink-soft underline underline-offset-4"
          onClick={() => {
            setProfile(DEMO_PERIPHERY_TAU);
            setStep(STEPS.length - 1);
          }}
        >
          מילוי דוגמה: שנה א׳ בתל אביב מהפריפריה
        </button>
      ) : null}
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="התקדמות בטופס">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => goTo(i)}
              className={`${tapBtn} text-sm ${
                i === step ? "bg-forest text-white" : i < step ? "bg-paper-deep text-ink" : "text-ink-soft"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      {hints.length > 0 && step < STEPS.length - 1 ? (
        <ul className="mt-4 rounded-2xl border border-warn/30 bg-warn/5 p-4 text-sm text-ink space-y-1">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 space-y-6 rounded-3xl border border-line bg-card p-6 sm:p-8" key={STEPS[step].id}>
        {step === 0 && (
          <>
            <Field field="institution" label="מוסד לימודים">
              <select
                className={inputClass}
                value={profile.institution ?? ""}
                onChange={(e) => patch({ institution: e.target.value || null })}
              >
                <option value="">בחירה / דילוג</option>
                {INSTITUTIONS_FOR_SELECT.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nameHe}
                  </option>
                ))}
              </select>
            </Field>
            <Field field="degreeLevel" label="שלב התואר">
              <select
                className={inputClass}
                value={profile.degreeLevel ?? ""}
                onChange={(e) =>
                  patch({ degreeLevel: (e.target.value || null) as StudentProfile["degreeLevel"] })
                }
              >
                <option value="">בחירה / דילוג</option>
                {DEGREE_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {fieldLabelHe(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field field="yearOfStudy" label="שנת לימוד">
              <select
                className={inputClass}
                value={profile.yearOfStudy ?? ""}
                onChange={(e) =>
                  patch({ yearOfStudy: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">לא יודע/ת</option>
                {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                  <option key={y} value={y}>
                    שנה {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field field="fieldOfStudy" label="קבוצת תחום לימוד" hint="משמש להתאמת מלגות STEM, רפואה, חינוך וכו׳.">
              <select
                className={inputClass}
                value={profile.fieldOfStudy ?? ""}
                onChange={(e) =>
                  patch({ fieldOfStudy: (e.target.value || null) as StudentProfile["fieldOfStudy"] })
                }
              >
                <option value="">לא יודע/ת</option>
                {FIELD_GROUPS.map((f) => (
                  <option key={f} value={f}>
                    {fieldLabelHe(f)}
                  </option>
                ))}
              </select>
            </Field>
            {showDegreeAverage ? (
              <Field field="average" label="ממוצע ציונים בתואר (0–100, אם ידוע)">
                <input
                  className={inputClass}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  value={profile.average ?? ""}
                  onChange={(e) =>
                    patch({ average: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  placeholder="אופציונלי"
                />
              </Field>
            ) : (
              <p className="text-sm text-ink-soft">
                בשנה א׳ / מכינה לא נשאל ממוצע תואר — נתוני קבלה למטה משמשים למלגות הצטיינות.
              </p>
            )}
            <Field
              field="bagrutAverage"
              label="ממוצע בגרות (אם ידוע)"
              hint="למלגות הצטיינות לשנה א׳. אפשר לדלג."
            >
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={0}
                max={120}
                step={0.1}
                value={profile.bagrutAverage ?? ""}
                onChange={(e) =>
                  patch({ bagrutAverage: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="אופציונלי"
              />
            </Field>
            <Field field="psychometric" label="ציון פסיכומטרי (אם ידוע)">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={200}
                max={800}
                value={profile.psychometric ?? ""}
                onChange={(e) =>
                  patch({ psychometric: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="אופציונלי"
              />
            </Field>
            <Field field="sechem" label="סכם / ציון התאמה (אם ידוע)" hint="אם המוסד מחשב סכם — הזינו אותו. אחרת דלגו.">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={200}
                max={800}
                value={profile.sechem ?? ""}
                onChange={(e) =>
                  patch({ sechem: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="אופציונלי"
              />
            </Field>
            <Field field="studyLoad" label="היקף לימודים" hint="מלגות רבות דורשות כ־60% משרה או 12 שעות שבועיות.">
              <select
                className={inputClass}
                value={profile.studyLoad ?? ""}
                onChange={(e) =>
                  patch({ studyLoad: (e.target.value || null) as StudentProfile["studyLoad"] })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="full">היקף מלא</option>
                <option value="partial">היקף חלקי</option>
              </select>
            </Field>
            {showMechina ? (
              <Field
                field="completedMechina"
                label="האם סיימתם מכינה קדם-אקדמית?"
                hint="נדרש למלגות ייעודיות כמו ייעוד 46. אם תדלגו — המלגה תופיע תחת «חסר פרט»."
              >
                <select
                  className={inputClass}
                  value={
                    profile.completedMechina === true
                      ? "yes"
                      : profile.completedMechina === false
                        ? "no"
                        : ""
                  }
                  onChange={(e) =>
                    patch({
                      completedMechina: e.target.value === "" ? null : e.target.value === "yes",
                    })
                  }
                >
                  <option value="">לא יודע/ת</option>
                  <option value="yes">כן</option>
                  <option value="no">לא</option>
                </select>
              </Field>
            ) : null}
          </>
        )}

        {step === 1 && (
          <>
            <Field field="cityOfResidence" label="עיר מגורים נוכחית">
              <CityPicker
                id="city-residence"
                value={profile.cityOfResidence ?? ""}
                onChange={(city) =>
                  patch({
                    cityOfResidence: city,
                    neighborhood: cityNeedsNeighborhood(city) ? profile.neighborhood : null,
                  })
                }
                suggestions={CITY_SUGGESTIONS}
                placeholder="הקלידו לחיפוש, למשל באר שבע"
              />
              <SkipButton onClick={() => patch({ cityOfResidence: null, neighborhood: null })} />
            </Field>
            <Field field="hometown" label="עיר מוצא / גדלתם בה">
              <CityPicker
                id="city-hometown"
                value={profile.hometown ?? ""}
                onChange={(city) => patch({ hometown: city })}
                suggestions={CITY_SUGGESTIONS}
                placeholder="אופציונלי"
              />
            </Field>
            {needNeighborhood ? (
              <Field
                field="neighborhood"
                label="שכונה / רובע"
                hint={
                  isTelAvivCity(profile.cityOfResidence)
                    ? "מלגת שכונות דרום ויפו דורשת שכונה ספציפית. בלי שכונה המלגה תופיע תחת «חסר פרט», לא כזכאות לכל העיר."
                    : "חלק מקרנות ירושלים מוגבלות לפי רובע. אם לא בטוחים — דלגו."
                }
              >
                <CityPicker
                  id="neighborhood"
                  value={profile.neighborhood ?? ""}
                  onChange={(n) => patch({ neighborhood: n })}
                  suggestions={neighborhoodSuggestions}
                  placeholder="למשל שפירא / יפו"
                />
                <SkipButton onClick={() => patch({ neighborhood: null })} />
              </Field>
            ) : null}
            <Field
              field="peripheryResidence"
              label="האם אתם גרים בפריפריה חברתית או גיאוגרפית?"
              hint="למלגות קרנות פרטיות (אייסף, גרוס ועוד). אם לא בטוחים — דלגו. הדגל המפורש גובר על העיר. זו אינה קביעה משפטית של אזור עדיפות לאומית."
            >
              <select
                className={inputClass}
                value={profile.peripheryResidence === true ? "yes" : profile.peripheryResidence === false ? "no" : ""}
                onChange={(e) =>
                  patch({
                    peripheryResidence: e.target.value === "" ? null : e.target.value === "yes",
                  })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <Field field="peripheryHometown" label="האם המוצא הוא מפריפריה?">
              <select
                className={inputClass}
                value={profile.peripheryHometown === true ? "yes" : profile.peripheryHometown === false ? "no" : ""}
                onChange={(e) =>
                  patch({
                    peripheryHometown: e.target.value === "" ? null : e.target.value === "yes",
                  })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <Field
              field="nationalPriorityResidence"
              label="כתובת רשומה באזור עדיפות לאומית — 5 מתוך 6 שנים?"
              hint="נדרש לייעוד 45/46 של משרד הביטחון. לא מספיק לגור היום בעיר מסוימת, ולא לפי רשימת ערים בקטלוג. אם תדלגו — המלגות יופיעו תחת «חסר פרט» ולא כזכאות."
            >
              <select
                className={inputClass}
                value={
                  profile.nationalPriorityResidence === true
                    ? "yes"
                    : profile.nationalPriorityResidence === false
                      ? "no"
                      : ""
                }
                onChange={(e) =>
                  patch({
                    nationalPriorityResidence:
                      e.target.value === "" ? null : e.target.value === "yes",
                  })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן, 5 מתוך 6 השנים שקדמו ללימודים</option>
                <option value="no">לא</option>
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field field="age" label="גיל">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={16}
                max={99}
                value={profile.age ?? ""}
                onChange={(e) => patch({ age: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field field="gender" label="מגדר" hint="נשאל רק כי חלק מהקרנות מוגבלות לפי מגדר.">
              <select
                className={inputClass}
                value={profile.gender ?? ""}
                onChange={(e) => patch({ gender: (e.target.value || null) as StudentProfile["gender"] })}
              >
                <option value="">מעדיף/ה לא לציין</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g === "other" ? "אחר / לא בינארי" : fieldLabelHe(g)}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset id={fieldDomId("familyFlags")}>
              <legend className="text-sm font-medium">מצב משפחתי (אפשר כמה)</legend>
              <div className="mt-2 grid gap-1">
                {FAMILY_FLAGS.map((f) => (
                  <label key={f} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={profile.familyFlags?.includes(f) ?? false}
                      onChange={(e) => {
                        patch({
                          familyFlags: toggleFlag(profile.familyFlags, f, e.target.checked),
                        });
                      }}
                    />
                    {fieldLabelHe(f)}
                  </label>
                ))}
              </div>
              <SkipButton onClick={() => patch({ familyFlags: null })} />
            </fieldset>
            <Field
              field="willingToVolunteer"
              label="האם אתם פתוחים להתנדבות כחלק ממלגה?"
              hint="מלגות כמו פר״ח דורשות חונכות. אם תדלגו — המלגות האלה יופיעו תחת «חסר פרט»."
            >
              <select
                className={inputClass}
                value={
                  profile.willingToVolunteer === true
                    ? "yes"
                    : profile.willingToVolunteer === false
                      ? "no"
                      : ""
                }
                onChange={(e) =>
                  patch({
                    willingToVolunteer: e.target.value === "" ? null : e.target.value === "yes",
                  })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן, פתוח/ה להתנדבות</option>
                <option value="no">לא מעוניין/ת במלגות התנדבות</option>
              </select>
            </Field>
            <fieldset id={fieldDomId("outstanding")}>
              <legend className="text-sm font-medium">פעילות בולטת</legend>
              <div className="mt-2 grid gap-1">
                {OUTSTANDING.map((o) => (
                  <label key={o} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={profile.outstanding?.includes(o) ?? false}
                      onChange={(e) => {
                        patch({
                          outstanding: toggleFlag(profile.outstanding, o, e.target.checked),
                        });
                      }}
                    />
                    {fieldLabelHe(o)}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 3 && (
          <>
            <Field field="service" label="שירות צבאי / לאומי / אזרחי">
              <select
                className={inputClass}
                value={profile.service ?? ""}
                onChange={(e) =>
                  onServiceChange((e.target.value || null) as StudentProfile["service"])
                }
              >
                <option value="">לא יודע/ת</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {fieldLabelHe(s)}
                  </option>
                ))}
              </select>
            </Field>
            {showServiceDetails ? (
              <>
                <Field field="combatRole" label="שירות במערך לוחם או תומך לחימה?">
                  <select
                    className={inputClass}
                    value={profile.combatRole === true ? "yes" : profile.combatRole === false ? "no" : ""}
                    onChange={(e) =>
                      patch({ combatRole: e.target.value === "" ? null : e.target.value === "yes" })
                    }
                  >
                    <option value="">לא יודע/ת / לא רלוונטי</option>
                    <option value="yes">כן</option>
                    <option value="no">לא</option>
                  </select>
                </Field>
                <Field field="yearsSinceDischarge" label="כמה שנים עברו מאז השחרור?">
                  <input
                    className={inputClass}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={40}
                    value={profile.yearsSinceDischarge ?? ""}
                    onChange={(e) =>
                      patch({
                        yearsSinceDischarge: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field field="loneSoldier" label="האם שירתתם כחייל/ת בודד/ה?">
                  <select
                    className={inputClass}
                    value={profile.loneSoldier === true ? "yes" : profile.loneSoldier === false ? "no" : ""}
                    onChange={(e) =>
                      patch({ loneSoldier: e.target.value === "" ? null : e.target.value === "yes" })
                    }
                  >
                    <option value="">לא יודע/ת</option>
                    <option value="yes">כן</option>
                    <option value="no">לא</option>
                  </select>
                </Field>
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                שאלות על לוחם, שחרור, מילואים וחייל בודד מוצגות רק אחרי שירות צה״ל או לאומי.
              </p>
            )}
            {showReservist ? (
              <Field field="reservistDaysLastYear" label="ימי מילואים בשנה האחרונה (בערך)">
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={profile.reservistDaysLastYear ?? ""}
                  onChange={(e) =>
                    patch({
                      reservistDaysLastYear: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </Field>
            ) : null}
          </>
        )}

        {step === 4 && (
          <>
            <fieldset id={fieldDomId("sectors")}>
              <legend className="text-sm font-medium">שיוך קהילתי</legend>
              <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                שואלים רק כי קיימות מלגות ייעודיות (למשל אירתקאא, טנא, מרום). השדה אופציונלי לחלוטין.
                אם תדלגו — מלגות שדורשות שיוך יופיעו תחת «חסר פרט לאישור».
              </p>
              <div className="mt-3 grid gap-1">
                {SECTORS.map((s) => (
                  <label key={s} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={profile.sectors?.includes(s) ?? false}
                      onChange={(e) => {
                        patch({
                          sectors: toggleFlag(profile.sectors, s, e.target.checked),
                        });
                      }}
                    />
                    {fieldLabelHe(s)}
                  </label>
                ))}
              </div>
              <SkipButton onClick={() => patch({ sectors: null })} />
            </fieldset>
            <Field field="isOleh" label="עולה חדש/ה או בעל/ת סטטוס עולה?">
              <select
                className={inputClass}
                value={profile.isOleh === true ? "yes" : profile.isOleh === false ? "no" : ""}
                onChange={(e) =>
                  onOlehChange(e.target.value === "" ? null : e.target.value === "yes")
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            {showYearsInIsrael ? (
              <Field field="yearsInIsrael" label="שנים בארץ">
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                  value={profile.yearsInIsrael ?? ""}
                  onChange={(e) =>
                    patch({ yearsInIsrael: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </Field>
            ) : null}
            <Field field="firstGeneration" label="דור ראשון להשכלה גבוהה?">
              <select
                className={inputClass}
                value={
                  profile.firstGeneration === true
                    ? "yes"
                    : profile.firstGeneration === false
                      ? "no"
                      : ""
                }
                onChange={(e) =>
                  patch({
                    firstGeneration: e.target.value === "" ? null : e.target.value === "yes",
                  })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <Field
              field="hasDisability"
              label="מוגבלות מוכרת?"
              hint="למשל נכות רפואית לצורך שיקום מקצועי. השדה רגיש ואופציונלי."
            >
              <select
                className={inputClass}
                value={
                  profile.hasDisability === true ? "yes" : profile.hasDisability === false ? "no" : ""
                }
                onChange={(e) =>
                  patch({ hasDisability: e.target.value === "" ? null : e.target.value === "yes" })
                }
              >
                <option value="">מעדיף/ה לא לציין</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <Field
              field="householdSize"
              label="כמה נפשות במשק הבית?"
              hint={HOUSEHOLD_INCOME_HINT_HE}
            >
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={profile.householdSize ?? ""}
                onChange={(e) =>
                  patch({ householdSize: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
              <SkipButton onClick={() => patch({ householdSize: null })} />
            </Field>
            <Field field="householdIncomeBand" label="הכנסת משק הבית לחודש (סדר גודל)">
              <select
                className={inputClass}
                value={profile.householdIncomeBand ?? ""}
                onChange={(e) =>
                  patch({
                    householdIncomeBand: (e.target.value ||
                      null) as StudentProfile["householdIncomeBand"],
                    incomeBand: null,
                  })
                }
              >
                <option value="">מעדיף/ה לא לציין</option>
                {HOUSEHOLD_INCOME_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {fieldLabelHe(b)}
                  </option>
                ))}
              </select>
            </Field>
            {derivedIncome ? (
              <p className="text-sm text-ink-soft">
                הערכה פנימית להכנסה לנפש: {fieldLabelHe(derivedIncome)}. זו אינה נוסחת הקרן.
              </p>
            ) : null}
          </>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="leading-relaxed text-ink">
              הפרופיל נשמר במכשיר זה בלבד. אפשר לחזור ולתקן בכל שלב. שדות שדולגו לא יפסלו מלגות —
              הן יופיעו תחת «חסר פרט לאישור».
            </p>
            <p className="rounded-2xl bg-paper-deep p-4 text-sm leading-relaxed">
              השדות שמשפיעים הכי הרבה על הדוח:{" "}
              {HIGH_IMPACT_FIELDS.map((f) => fieldLabelHe(f)).join(" · ")}.
            </p>
            {hints.length > 0 ? (
              <ul className="rounded-2xl border border-warn/30 bg-warn/5 p-4 text-sm space-y-1">
                {hints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}
            <dl className="grid gap-3 text-sm">
              {WIZARD_FIELDS.map((field) => (
                <div
                  key={field}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-2"
                >
                  <div>
                    <dt className="text-ink-soft">{fieldLabelHe(field)}</dt>
                    <dd>{formatProfileValueHe(field, profile[field])}</dd>
                  </div>
                  <button
                    type="button"
                    className="min-h-11 text-sm text-forest underline underline-offset-4"
                    onClick={() => goTo(FIELD_STEP[field] ?? 0)}
                  >
                    עריכה
                  </button>
                </div>
              ))}
            </dl>
            {selectedInstitution ? (
              <p className="text-sm text-ink-soft">
                מוסד שנבחר: <HeWithEn text={selectedInstitution.nameHe} />
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${tapBtn} border border-line text-sm`}
                onClick={() => downloadProfileJson(profile)}
              >
                ייצוא פרופיל (JSON)
              </button>
              <button
                type="button"
                className={`${tapBtn} border border-line text-sm`}
                onClick={() => fileRef.current?.click()}
              >
                ייבוא פרופיל
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="בחירת קובץ פרופיל לייבוא"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const parsed = parseImportedProfile(String(reader.result ?? ""));
                    if (!parsed) {
                      setImportError("לא הצלחנו לקרוא את הקובץ. ודאו שזה ייצוא JSON מהאתר.");
                      return;
                    }
                    setImportError(null);
                    setProfile(parsed);
                  };
                  reader.readAsText(file);
                }}
              />
            </div>
            {importError ? <p className="text-sm text-danger">{importError}</p> : null}
            <button
              type="button"
              className="w-full min-h-11 rounded-full bg-clay py-3 text-white font-medium hover:bg-clay-deep"
              onClick={() => router.push("/results")}
            >
              להפקת דוח הזכאות
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between no-print">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className={`${tapBtn} text-ink-soft disabled:opacity-40`}
        >
          הקודם
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={`${tapBtn} bg-forest text-white hover:bg-forest-deep`}>
            המשך
          </button>
        ) : null}
      </div>
    </div>
  );
}
