"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CityPicker } from "@/components/CityPicker";
import { HeWithEn } from "@/components/HeWithEn";
import { CITY_SUGGESTIONS } from "@/lib/cities";
import {
  applyChatAction,
  canOfferChatReport,
  chatReportCounts,
  filterInstitutions,
  nextChatQuestion,
  popularCities,
  popularInstitutions,
  safeLoadChatProfile,
  type ChatChoice,
  type ChatQuestion,
} from "@/lib/chat-intake";
import { HE } from "@/lib/i18n/he";
import { fieldLabelHe, formatProfileValueHe } from "@/lib/labels";
import { filledWizardFieldCount } from "@/lib/profile-fields";
import { loadProfile, saveProfile } from "@/lib/profile-storage";
import type { StudentProfile } from "@/lib/types";

export type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  questionId?: string;
  offer?: boolean;
  summary?: boolean;
};

const tapBtn =
  "min-h-12 min-w-12 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-medium";

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function openingChatMessages(profile: StudentProfile): {
  messages: ChatMessage[];
  reportOpen: boolean;
  offerShown: boolean;
} {
  const first = nextChatQuestion(profile, []);
  const messages: ChatMessage[] = [{ id: "intro", role: "bot", text: HE.chat.intro }];
  if (filledWizardFieldCount(profile) > 0) {
    messages.push({ id: "resume", role: "bot", text: HE.chat.resume });
  }
  if (first) {
    messages.push({
      id: `q-${first.id}`,
      role: "bot",
      text: first.promptHe,
      questionId: first.id,
    });
    if (canOfferChatReport(profile)) {
      messages.push({ id: "offer-resume", role: "bot", text: HE.chat.offerAfterAnswers, offer: true });
      return { messages, reportOpen: false, offerShown: true };
    }
    return { messages, reportOpen: false, offerShown: false };
  }
  if (filledWizardFieldCount(profile) >= 1) {
    messages.push({ id: "done", role: "bot", text: HE.chat.done });
    return { messages, reportOpen: true, offerShown: true };
  }
  messages.push({ id: "empty-done", role: "bot", text: HE.chat.emptyDone });
  return { messages, reportOpen: false, offerShown: false };
}

const EMPTY_OPENING = openingChatMessages({});

export function ChatIntake() {
  const [profile, setProfile] = useState<StudentProfile>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(EMPTY_OPENING.messages);
  const [storageReady, setStorageReady] = useState(false);
  const [reportOpen, setReportOpen] = useState(EMPTY_OPENING.reportOpen);
  const [offerShown, setOfferShown] = useState(EMPTY_OPENING.offerShown);
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [sectorDraft, setSectorDraft] = useState<string[]>([]);
  const [extrasIntroShown, setExtrasIntroShown] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const reportOpenRef = useRef(EMPTY_OPENING.reportOpen);

  const question = useMemo(() => nextChatQuestion(profile, askedIds), [profile, askedIds]);
  const filled = filledWizardFieldCount(profile);
  const showReportAction = canOfferChatReport(profile) || (reportOpen && filled >= 1);

  useEffect(() => {
    try {
      const p = safeLoadChatProfile(loadProfile);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
      setProfile(p);
      const opening = openingChatMessages(p);
      setMessages(opening.messages);
      setReportOpen(opening.reportOpen);
      setOfferShown(opening.offerShown);
      reportOpenRef.current = opening.reportOpen;
    } catch {
      // Keep the empty-profile first question already on screen.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveProfile(profile);
  }, [profile, storageReady]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, question, reportOpen]);

  function pushMessages(...next: ChatMessage[]) {
    setMessages((m) => [...m, ...next]);
  }

  function afterProfileChange(nextProfile: StudentProfile, nextAsked: string[], userText: string) {
    const prevFilled = filled;
    setProfile(nextProfile);
    setAskedIds(nextAsked);
    setInstitutionQuery("");
    setCityDraft("");
    setSectorDraft([]);

    const userMsg: ChatMessage = { id: newId("u"), role: "user", text: userText };
    const follow: ChatMessage[] = [userMsg];

    const nextQ = nextChatQuestion(nextProfile, nextAsked);
    const nextFilled = filledWizardFieldCount(nextProfile);
    const justCrossed = !offerShown && nextFilled >= 3 && prevFilled < 3;

    if (justCrossed && nextQ) {
      follow.push({ id: newId("offer"), role: "bot", text: HE.chat.offerAfterAnswers, offer: true });
      setOfferShown(true);
    }

    if (nextQ) {
      if (!nextQ.core && !extrasIntroShown) {
        follow.push({ id: newId("extras"), role: "bot", text: HE.chat.extrasIntro });
        setExtrasIntroShown(true);
      }
      follow.push({
        id: `q-${nextQ.id}-${nextAsked.length}`,
        role: "bot",
        text: nextQ.promptHe,
        questionId: nextQ.id,
      });
    } else if (nextFilled >= 1) {
      follow.push({ id: newId("done"), role: "bot", text: HE.chat.done });
      reportOpenRef.current = true;
      setReportOpen(true);
    } else {
      follow.push({ id: newId("empty"), role: "bot", text: HE.chat.emptyDone });
    }

    pushMessages(...follow);
  }

  function onChoice(q: ChatQuestion, choice: ChatChoice) {
    const next = applyChatAction({ profile, askedIds }, { type: "choice", question: q, choice });
    afterProfileChange(next.profile, next.askedIds, choice.labelHe);
  }

  function onSkip(q: ChatQuestion) {
    const next = applyChatAction({ profile, askedIds }, { type: "skip", question: q });
    afterProfileChange(next.profile, next.askedIds, HE.chat.skipped);
  }

  function onInstitution(id: string, nameHe: string) {
    if (!question) return;
    const next = applyChatAction(
      { profile, askedIds },
      { type: "institution", question, institutionId: id },
    );
    afterProfileChange(next.profile, next.askedIds, nameHe);
  }

  function onCity(city: string) {
    if (!question) return;
    const next = applyChatAction({ profile, askedIds }, { type: "city", question, city });
    afterProfileChange(next.profile, next.askedIds, city);
  }

  function onSectorsConfirm() {
    if (!question) return;
    const next = applyChatAction(
      { profile, askedIds },
      { type: "multi", question, values: sectorDraft },
    );
    const label =
      sectorDraft.length === 0 ? HE.chat.skipped : formatProfileValueHe("sectors", sectorDraft);
    afterProfileChange(next.profile, next.askedIds, label);
  }

  function onShowReport() {
    if (reportOpenRef.current) return;
    reportOpenRef.current = true;
    setReportOpen(true);
    pushMessages({
      id: newId("summary"),
      role: "bot",
      text: HE.chat.reportHint,
      summary: true,
    });
  }

  const counts = useMemo(
    () => (reportOpen ? chatReportCounts(profile) : null),
    [reportOpen, profile],
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col px-3 pb-4 pt-6 sm:px-4">
      <header className="mb-4">
        <h1 className="font-display text-3xl text-forest-deep">{HE.chat.title}</h1>
        <p className="mt-2 text-base leading-relaxed text-ink">{HE.chat.intro}</p>
      </header>

      <div className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.map((msg) =>
          msg.id === "intro" ? null : <ChatBubble key={msg.id} message={msg} onShowReport={onShowReport} />,
        )}

        {question && !reportOpen && messages.some((m) => m.questionId === question.id) ? (
          <QuestionControls
            question={question}
            institutionQuery={institutionQuery}
            onInstitutionQuery={setInstitutionQuery}
            onChoice={onChoice}
            onSkip={onSkip}
            onInstitution={onInstitution}
            onCity={onCity}
            cityDraft={cityDraft}
            onCityDraft={setCityDraft}
            sectorDraft={sectorDraft}
            onSectorDraft={setSectorDraft}
            onSectorsConfirm={onSectorsConfirm}
          />
        ) : null}

        {counts ? <ReportSummary counts={counts} /> : null}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 z-10 mt-4 space-y-2 bg-paper/95 pb-2 pt-3 backdrop-blur-sm no-print">
        <div className="flex flex-wrap gap-2">
          {question ? (
            <button type="button" className={`${tapBtn} border border-line text-ink-soft`} onClick={() => onSkip(question)}>
              {HE.chat.skip}
            </button>
          ) : null}
          {showReportAction && !reportOpen ? (
            <button type="button" className={`${tapBtn} bg-clay text-white hover:bg-clay-deep`} onClick={onShowReport}>
              {HE.chat.showReportNow}
            </button>
          ) : null}
          {reportOpen && question ? (
            <button
              type="button"
              className={`${tapBtn} border border-line text-ink`}
              onClick={() => {
                reportOpenRef.current = false;
                setReportOpen(false);
              }}
            >
              {HE.chat.continueQuestions}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {reportOpen ? (
            <Link href="/results/" className="min-h-11 inline-flex items-center underline underline-offset-4 text-forest">
              {HE.chat.fullReport}
            </Link>
          ) : null}
          <Link href="/profile/" className="min-h-11 inline-flex items-center underline underline-offset-4 text-ink-soft">
            {HE.chat.completeProfile}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  onShowReport,
}: {
  message: ChatMessage;
  onShowReport: () => void;
}) {
  const bot = message.role === "bot";
  return (
    <div className={`flex ${bot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
          bot
            ? "rounded-ss-md border border-line bg-card text-ink"
            : "rounded-se-md bg-forest text-white"
        }`}
      >
        <p>{message.text}</p>
        {message.offer ? (
          <button
            type="button"
            className="mt-3 min-h-12 rounded-2xl bg-clay px-5 py-3 text-white hover:bg-clay-deep"
            onClick={onShowReport}
          >
            {HE.chat.showReportNow}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReportSummary({
  counts,
}: {
  counts: ReturnType<typeof chatReportCounts>;
}) {
  const rows: { key: string; label: string; n: number }[] = [
    { key: "eligible", label: HE.buckets.eligible, n: counts.eligible },
    { key: "needInfo", label: HE.buckets.needInfo, n: counts.needInfo },
    { key: "nearMiss", label: HE.buckets.nearMiss, n: counts.nearMiss },
    { key: "guide", label: HE.buckets.guide, n: counts.guide },
    { key: "ineligible", label: HE.buckets.ineligible, n: counts.ineligible },
  ];
  return (
    <div className="rounded-2xl border border-forest/20 bg-forest/5 p-4">
      <p className="text-sm text-ink-soft">{HE.chat.reportHint}</p>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex min-h-11 items-center justify-between gap-3 text-base">
            <span>{r.label}</span>
            <span className="tabular-nums font-medium text-forest-deep">{r.n}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/results/"
        className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-forest px-5 py-3 text-white hover:bg-forest-deep"
      >
        {HE.chat.fullReport}
      </Link>
    </div>
  );
}

function ChipButtons({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function QuestionControls({
  question,
  institutionQuery,
  onInstitutionQuery,
  onChoice,
  onSkip,
  onInstitution,
  onCity,
  cityDraft,
  onCityDraft,
  sectorDraft,
  onSectorDraft,
  onSectorsConfirm,
}: {
  question: ChatQuestion;
  institutionQuery: string;
  onInstitutionQuery: (q: string) => void;
  onChoice: (q: ChatQuestion, choice: ChatChoice) => void;
  onSkip: (q: ChatQuestion) => void;
  onInstitution: (id: string, nameHe: string) => void;
  onCity: (city: string) => void;
  cityDraft: string;
  onCityDraft: (v: string) => void;
  sectorDraft: string[];
  onSectorDraft: (v: string[]) => void;
  onSectorsConfirm: () => void;
}) {
  if (question.kind === "choices" && question.choices) {
    return (
      <ChipButtons label={question.promptHe}>
        {question.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${tapBtn} border border-line bg-card text-ink shadow-sm hover:bg-paper-deep`}
            onClick={() => onChoice(question, c)}
          >
            {c.labelHe}
          </button>
        ))}
      </ChipButtons>
    );
  }

  if (question.kind === "search-institution") {
    const searching = Boolean(institutionQuery.trim());
    const list = searching ? filterInstitutions(institutionQuery) : popularInstitutions();
    const chips = list.length > 0 ? list : popularInstitutions();
    return (
      <div className="space-y-3">
        {question.hintHe ? <p className="text-sm text-ink-soft">{question.hintHe}</p> : null}
        {!searching ? <p className="text-sm text-ink-soft">{HE.chat.popularInstitutions}</p> : null}
        <ChipButtons label={question.promptHe}>
          {chips.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`${tapBtn} border border-line bg-card text-ink shadow-sm hover:bg-paper-deep`}
              onClick={() => onInstitution(i.id, i.nameHe)}
            >
              <HeWithEn text={i.nameHe} />
            </button>
          ))}
        </ChipButtons>
        <div className="space-y-1.5">
          <label className="block text-sm text-ink-soft" htmlFor="chat-institution-search">
            {HE.chat.moreHint}
          </label>
          <input
            id="chat-institution-search"
            className="w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink"
            value={institutionQuery}
            onChange={(e) => onInstitutionQuery(e.target.value)}
            placeholder={HE.chat.searchInstitution}
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  if (question.kind === "search-city") {
    const cities = popularCities();
    return (
      <div className="space-y-3">
        {question.hintHe ? <p className="text-sm text-ink-soft">{question.hintHe}</p> : null}
        {cities.length > 0 ? (
          <ChipButtons label={question.promptHe}>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                className={`${tapBtn} border border-line bg-card text-ink shadow-sm hover:bg-paper-deep`}
                onClick={() => onCity(city)}
              >
                {city}
              </button>
            ))}
          </ChipButtons>
        ) : null}
        <div className="space-y-1.5">
          <p id="chat-city-label" className="text-sm text-ink-soft">
            {HE.chat.searchCity}
          </p>
          <CityPicker
            id="chat-city-residence"
            value={cityDraft}
            onChange={(city) => {
              const next = city ?? "";
              if (next && CITY_SUGGESTIONS.includes(next)) {
                onCity(next);
                return;
              }
              onCityDraft(next);
            }}
            suggestions={CITY_SUGGESTIONS}
            placeholder={HE.chat.searchCity}
            labelledBy="chat-city-label"
          />
        </div>
        {cityDraft.trim() && !CITY_SUGGESTIONS.includes(cityDraft) ? (
          <button
            type="button"
            className={`${tapBtn} bg-forest text-white hover:bg-forest-deep`}
            onClick={() => onCity(cityDraft.trim())}
          >
            {`לבחור «${cityDraft.trim()}»`}
          </button>
        ) : null}
      </div>
    );
  }

  if (question.kind === "multi" && question.multiValues) {
    return (
      <div className="space-y-3">
        <ChipButtons label={question.promptHe}>
          {question.multiValues.map((v) => {
            const on = sectorDraft.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                className={`${tapBtn} border ${
                  on ? "border-forest bg-forest text-white" : "border-line bg-card text-ink"
                }`}
                onClick={() =>
                  onSectorDraft(on ? sectorDraft.filter((x) => x !== v) : [...sectorDraft, v])
                }
              >
                {fieldLabelHe(v)}
              </button>
            );
          })}
        </ChipButtons>
        <button type="button" className={`${tapBtn} bg-forest text-white hover:bg-forest-deep`} onClick={onSectorsConfirm}>
          {sectorDraft.length ? HE.chat.sectorsConfirm : HE.chat.skip}
        </button>
      </div>
    );
  }

  return (
    <button type="button" className={`${tapBtn} text-ink-soft underline`} onClick={() => onSkip(question)}>
      {HE.chat.skip}
    </button>
  );
}
