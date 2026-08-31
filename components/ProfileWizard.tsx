"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { StudentProfile } from "@/lib/types";
import {
  DEGREE_LEVELS,
  FAMILY_FLAGS,
  FIELD_GROUPS,
  GENDERS,
  INCOME_BANDS,
  OUTSTANDING,
  SECTORS,
  SERVICE_TYPES,
  SOCIAL_BENEFITS,
} from "@/lib/types";
import { INSTITUTIONS_FOR_SELECT } from "@/lib/institutions";
import { CITY_SUGGESTIONS } from "@/lib/cities";
import { fieldLabelHe } from "@/lib/labels";
import { loadProfile, saveProfile } from "@/lib/profile-storage";

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
  incomeBand: "low",
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

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm text-ink-soft underline underline-offset-4">
      לא יודע/ת — דלג
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="mt-1 block text-sm text-ink-soft leading-relaxed">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70";

export function ProfileWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile(profile);
  }, [profile, ready]);

  const selectedInstitution = useMemo(
    () => INSTITUTIONS_FOR_SELECT.find((i) => i.id === profile.institution),
    [profile.institution],
  );

  function patch(partial: StudentProfile) {
    setProfile((p) => ({ ...p, ...partial }));
  }

  function next() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        שלב {step + 1} מתוך {STEPS.length}
      </p>
      <h1 className="mt-1 font-display text-3xl text-forest-deep">{STEPS[step].title}</h1>
      <button
        type="button"
        className="mt-2 text-sm text-ink-soft underline underline-offset-4"
        onClick={() => {
          setProfile(DEMO_PERIPHERY_TAU);
          setStep(STEPS.length - 1);
        }}
      >
        מילוי דוגמה: שנה א׳ בתל אביב מהפריפריה
      </button>
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="התקדמות בטופס">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-sm ${
                i === step ? "bg-forest text-white" : i < step ? "bg-paper-deep text-ink" : "text-ink-soft"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6 rounded-3xl border border-line bg-card p-6 sm:p-8">
        {step === 0 && (
          <>
            <Field label="מוסד לימודים">
              <select
                className={inputClass}
                value={profile.institution ?? ""}
                onChange={(e) => patch({ institution: e.target.value || null, campus: null })}
              >
                <option value="">בחירה / דילוג</option>
                {INSTITUTIONS_FOR_SELECT.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nameHe}
                  </option>
                ))}
              </select>
            </Field>
            {selectedInstitution?.campuses?.length ? (
              <Field label="קמפוס (אם רלוונטי)">
                <select
                  className={inputClass}
                  value={profile.campus ?? ""}
                  onChange={(e) => patch({ campus: e.target.value || null })}
                >
                  <option value="">לא צוין</option>
                  {selectedInstitution.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameHe}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="שלב התואר">
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
            <Field label="שנת לימוד">
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
            <Field label="פקולטה / חוג" hint="טקסט חופשי, למשל «מדעי המחשב» או «עבודה סוציאלית».">
              <input
                className={inputClass}
                value={profile.faculty ?? ""}
                onChange={(e) => patch({ faculty: e.target.value || null })}
                placeholder="אופציונלי"
              />
            </Field>
            <Field label="קבוצת תחום לימוד" hint="משמש להתאמת מלגות STEM, רפואה, חינוך וכו׳.">
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
            <Field label="ממוצע ציונים (0–100, אם ידוע)">
              <input
                className={inputClass}
                type="number"
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
            <Field label="היקף לימודים" hint="מלגות רבות דורשות כ־60% משרה או 12 שעות שבועיות.">
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
            <Field
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
          </>
        )}

        {step === 1 && (
          <>
            <Field label="עיר מגורים נוכחית">
              <input
                className={inputClass}
                list="cities"
                value={profile.cityOfResidence ?? ""}
                onChange={(e) => patch({ cityOfResidence: e.target.value || null })}
                placeholder="למשל באר שבע"
              />
              <datalist id="cities">
                {CITY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="mt-2">
                <SkipButton onClick={() => patch({ cityOfResidence: null })} />
              </div>
            </Field>
            <Field label="עיר מוצא / גדלתם בה">
              <input
                className={inputClass}
                list="cities"
                value={profile.hometown ?? ""}
                onChange={(e) => patch({ hometown: e.target.value || null })}
                placeholder="אופציונלי"
              />
            </Field>
            <Field
              label="האם אתם גרים בפריפריה / אזור עדיפות לאומית?"
              hint="אם לא בטוחים — דלגו. נשתמש בעיר כעזר בלבד, והדגל המפורש שלכם גובר."
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
            <Field label="האם המוצא הוא מפריפריה?">
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
          </>
        )}

        {step === 2 && (
          <>
            <Field label="גיל">
              <input
                className={inputClass}
                type="number"
                min={16}
                max={99}
                value={profile.age ?? ""}
                onChange={(e) => patch({ age: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="מגדר" hint="נשאל רק כי חלק מהקרנות מוגבלות לפי מגדר.">
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
            <fieldset>
              <legend className="text-sm font-medium">מצב משפחתי (אפשר כמה)</legend>
              <div className="mt-2 grid gap-2">
                {FAMILY_FLAGS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profile.familyFlags?.includes(f) ?? false}
                      onChange={(e) => {
                        const current = profile.familyFlags ?? [];
                        patch({
                          familyFlags: e.target.checked
                            ? [...current, f]
                            : current.filter((x) => x !== f),
                        });
                      }}
                    />
                    {fieldLabelHe(f)}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <SkipButton onClick={() => patch({ familyFlags: null })} />
              </div>
            </fieldset>
            <Field label="שעות עבודה בשבוע (בערך)">
              <input
                className={inputClass}
                type="number"
                min={0}
                max={80}
                value={profile.employmentHours ?? ""}
                onChange={(e) =>
                  patch({ employmentHours: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="שעות התנדבות בשנה (אם כבר יש)">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={profile.volunteerHoursPerYear ?? ""}
                onChange={(e) =>
                  patch({
                    volunteerHoursPerYear: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field
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
            <Field label="האם אתם בפר״ח כבר עכשיו?">
              <select
                className={inputClass}
                value={profile.hasPerach === true ? "yes" : profile.hasPerach === false ? "no" : ""}
                onChange={(e) =>
                  patch({ hasPerach: e.target.value === "" ? null : e.target.value === "yes" })
                }
              >
                <option value="">לא רלוונטי / לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">פעילות בולטת</legend>
              <div className="mt-2 grid gap-2">
                {OUTSTANDING.map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profile.outstanding?.includes(o) ?? false}
                      onChange={(e) => {
                        const current = profile.outstanding ?? [];
                        patch({
                          outstanding: e.target.checked
                            ? [...current, o]
                            : current.filter((x) => x !== o),
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
            <Field label="שירות צבאי / לאומי / אזרחי">
              <select
                className={inputClass}
                value={profile.service ?? ""}
                onChange={(e) =>
                  patch({ service: (e.target.value || null) as StudentProfile["service"] })
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
            <Field label="שירות במערך לוחם או תומך לחימה?">
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
            <Field label="כמה שנים עברו מאז השחרור?">
              <input
                className={inputClass}
                type="number"
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
            <Field label="ימי מילואים בשנה האחרונה (בערך)">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={profile.reservistDaysLastYear ?? ""}
                onChange={(e) =>
                  patch({
                    reservistDaysLastYear: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="האם שירתתם כחייל/ת בודד/ה?">
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
        )}

        {step === 4 && (
          <>
            <fieldset>
              <legend className="text-sm font-medium">שיוך קהילתי</legend>
              <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                שואלים רק כי קיימות מלגות ייעודיות (למשל אירתקאא, טנא, מרום). השדה אופציונלי לחלוטין.
                אם תדלגו — מלגות שדורשות שיוך יופיעו תחת «חסר פרט לאישור».
              </p>
              <div className="mt-3 grid gap-2">
                {SECTORS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profile.sectors?.includes(s) ?? false}
                      onChange={(e) => {
                        const current = profile.sectors ?? [];
                        patch({
                          sectors: e.target.checked ? [...current, s] : current.filter((x) => x !== s),
                        });
                      }}
                    />
                    {fieldLabelHe(s)}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <SkipButton onClick={() => patch({ sectors: null })} />
              </div>
            </fieldset>
            <Field label="עולה חדש/ה או בעל/ת סטטוס עולה?">
              <select
                className={inputClass}
                value={profile.isOleh === true ? "yes" : profile.isOleh === false ? "no" : ""}
                onChange={(e) =>
                  patch({ isOleh: e.target.value === "" ? null : e.target.value === "yes" })
                }
              >
                <option value="">לא יודע/ת</option>
                <option value="yes">כן</option>
                <option value="no">לא</option>
              </select>
            </Field>
            <Field label="שנים בארץ (אם רלוונטי)">
              <input
                className={inputClass}
                type="number"
                min={0}
                max={80}
                value={profile.yearsInIsrael ?? ""}
                onChange={(e) =>
                  patch({ yearsInIsrael: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="דור ראשון להשכלה גבוהה?">
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
              label="רמת הכנסה משק בית (בערך)"
              hint="לא שואלים סכום מדויק. מלגות סיוע משתמשות במדרגות. אפשר לדלג."
            >
              <select
                className={inputClass}
                value={profile.incomeBand ?? ""}
                onChange={(e) =>
                  patch({ incomeBand: (e.target.value || null) as StudentProfile["incomeBand"] })
                }
              >
                <option value="">מעדיף/ה לא לציין</option>
                {INCOME_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {fieldLabelHe(b)}
                  </option>
                ))}
              </select>
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">גמלאות ביטוח לאומי (אם יש)</legend>
              <div className="mt-2 grid gap-2">
                {SOCIAL_BENEFITS.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={profile.socialBenefits?.includes(b) ?? false}
                      onChange={(e) => {
                        const current = profile.socialBenefits ?? [];
                        patch({
                          socialBenefits: e.target.checked
                            ? [...current, b]
                            : current.filter((x) => x !== b),
                        });
                      }}
                    />
                    {fieldLabelHe(b)}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <SkipButton onClick={() => patch({ socialBenefits: null })} />
              </div>
            </fieldset>
          </>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="leading-relaxed text-ink">
              הפרופיל נשמר במכשיר זה בלבד. אפשר לחזור ולתקן בכל שלב. שדות שדולגו לא יפסלו מלגות —
              הן יופיעו תחת «חסר פרט לאישור».
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-soft">מוסד</dt>
                <dd>{selectedInstitution?.nameHe ?? "לא צוין"}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">תואר / שנה</dt>
                <dd>
                  {profile.degreeLevel ? fieldLabelHe(profile.degreeLevel) : "לא צוין"}
                  {profile.yearOfStudy ? ` · שנה ${profile.yearOfStudy}` : ""}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="w-full rounded-full bg-clay py-3 text-white font-medium hover:bg-clay-deep"
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
          className="rounded-full px-5 py-2 text-ink-soft disabled:opacity-40"
        >
          הקודם
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-forest px-5 py-2 text-white hover:bg-forest-deep"
          >
            המשך
          </button>
        ) : null}
      </div>
    </div>
  );
}
