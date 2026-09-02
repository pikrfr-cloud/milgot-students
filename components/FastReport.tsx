"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { StudentProfile } from "@/lib/types";
import { DEGREE_LEVELS, SERVICE_TYPES } from "@/lib/types";
import { INSTITUTION_GROUPS } from "@/lib/institutions";
import { CITY_SUGGESTIONS } from "@/lib/cities";
import { fieldLabelHe } from "@/lib/labels";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import { FAST_REPORT_FIELDS, fieldDomId } from "@/lib/profile-fields";
import { CityPicker } from "@/components/CityPicker";
import { Field } from "@/components/Field";
import { HE } from "@/lib/i18n/he";
import Link from "next/link";

const STEPS = [
  { field: "institution" as const, title: "מוסד לימודים" },
  { field: "degreeLevel" as const, title: "שלב התואר" },
  { field: "yearOfStudy" as const, title: "שנת לימוד" },
  { field: "cityOfResidence" as const, title: "עיר מגורים" },
  { field: "service" as const, title: "שירות" },
];

const tapBtn =
  "min-h-11 min-w-11 inline-flex items-center justify-center rounded-full px-5 py-2";
const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-ink-soft/70";

export function FastReport() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<StudentProfile>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile(profile);
  }, [profile, ready]);

  function patch(partial: StudentProfile) {
    setProfile((p) => ({ ...p, ...partial }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/results/");
  }

  if (!ready) {
    return <p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>;
  }

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        {HE.nav.fastReport} · שלב {step + 1} מתוך {STEPS.length}
      </p>
      <h1 className="mt-1 font-display text-3xl text-forest-deep">{current.title}</h1>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">
        חמש שאלות ואז דוח חלקי מיד. אפשר להשלים את שאר הפרופיל אחר כך — ההתקדמות נשמרת במכשיר.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2" aria-label="התקדמות בדוח המהיר">
        {STEPS.map((s, i) => (
          <li key={s.field}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`${tapBtn} text-sm ${
                i === step ? "bg-forest text-white" : i < step ? "bg-paper-deep text-ink" : "text-ink-soft"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6 rounded-3xl border border-line bg-card p-6 sm:p-8">
        {current.field === "institution" ? (
          <Field field="institution" label="מוסד לימודים">
            <select
              className={inputClass}
              value={profile.institution ?? ""}
              onChange={(e) => patch({ institution: e.target.value || null })}
            >
              <option value="">בחירה / דילוג</option>
              {INSTITUTION_GROUPS.map((g) => (
                <optgroup key={g.labelHe} label={g.labelHe}>
                  {g.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameHe}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        ) : null}

        {current.field === "degreeLevel" ? (
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
        ) : null}

        {current.field === "yearOfStudy" ? (
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
        ) : null}

        {current.field === "cityOfResidence" ? (
          <Field field="cityOfResidence" label="עיר מגורים נוכחית">
            <CityPicker
              id="fast-city-residence"
              value={profile.cityOfResidence ?? ""}
              onChange={(city) => patch({ cityOfResidence: city })}
              suggestions={CITY_SUGGESTIONS}
              placeholder="הקלידו לחיפוש"
            />
            <button
              type="button"
              className="mt-2 min-h-11 text-sm text-ink-soft underline underline-offset-4"
              onClick={() => patch({ cityOfResidence: null })}
            >
              {HE.actions.skip}
            </button>
          </Field>
        ) : null}

        {current.field === "service" ? (
          <Field field="service" label="שירות צבאי / לאומי / אזרחי">
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
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className={`${tapBtn} text-ink-soft disabled:opacity-40`}
        >
          {HE.actions.back}
        </button>
        <button type="button" onClick={next} className={`${tapBtn} bg-forest text-white hover:bg-forest-deep`}>
          {step < STEPS.length - 1 ? HE.actions.continue : "הצגת דוח חלקי"}
        </button>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        <Link href="/chat/" className="underline underline-offset-4">
          {HE.actions.chatIntake}
        </Link>
        {" · "}
        <Link href="/profile/" className="underline underline-offset-4">
          {HE.actions.completeProfile}
        </Link>
        {" — "}
        האשף המלא נשאר ההמשך, לא מבוי סתום.
      </p>
      <p className="sr-only" id={fieldDomId(FAST_REPORT_FIELDS[step] ?? "institution")}>
        {current.title}
      </p>
    </div>
  );
}
