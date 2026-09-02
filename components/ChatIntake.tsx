"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CityPicker } from "@/components/CityPicker";
import { HeWithEn } from "@/components/HeWithEn";
import { CITY_SUGGESTIONS } from "@/lib/cities";
import {
  applyChatAction,
  canOfferChatReport,
  chatReportCounts,
  filterInstitutions,
  nextChatQuestion,
  type ChatChoice,
  type ChatQuestion,
} from "@/lib/chat-intake";
import { HE } from "@/lib/i18n/he";
import { fieldLabelHe, formatProfileValueHe } from "@/lib/labels";
import { filledWizardFieldCount } from "@/lib/profile-fields";
import { loadProfileHydratingShare } from "@/lib/profile-share";
import { saveProfile } from "@/lib/profile-storage";
import type { StudentProfile } from "@/lib/types";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  questionId?: string;
  offer?: boolean;
  summary?: boolean;
};

const tapBtn =
  "min-h-11 min-w-11 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-base";

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatIntake() {
  const [profile, setProfile] = useState<StudentProfile>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerShown, setOfferShown] = useState(false);
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [sectorDraft, setSectorDraft] = useState<string[]>([]);
  const [extrasIntroShown, setExtrasIntroShown] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const reportOpenRef = useRef(false);

  const question = useMemo(() => nextChatQuestion(profile, askedIds), [profile, askedIds]);
  const filled = filledWizardFieldCount(profile);
  const showReportAction = canOfferChatReport(profile) || (reportOpen && filled >= 1);

  useEffect(() => {
    const p = loadProfileHydratingShare();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client storage
    setProfile(p);
    const first = nextChatQuestion(p, []);
    const start: ChatMessage[] = [{ id: "intro", role: "bot", text: HE.chat.intro }];
    if (filledWizardFieldCount(p) > 0) {
      start.push({ id: "resume", role: "bot", text: HE.chat.resume });
    }
    if (first) {
      start.push({
        id: `q-${first.id}`,
        role: "bot",
        text: first.promptHe,
        questionId: first.id,
      });
      if (canOfferChatReport(p)) {
        start.push({ id: "offer-resume", role: "bot", text: HE.chat.offerAfterAnswers, offer: true });
        setOfferShown(true);
      }
    } else if (filledWizardFieldCount(p) >= 1) {
      start.push({ id: "done", role: "bot", text: HE.chat.done });
      reportOpenRef.current = true;
      setReportOpen(true);
    } else {
      start.push({ id: "empty-done", role: "bot", text: HE.chat.emptyDone });
    }
    setMessages(start);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile(profile);
  }, [profile, ready]);

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

  if (!ready) {
    return <p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col px-3 pb-4 pt-6 sm:px-4">
      <header className="mb-4">
        <h1 className="font-display text-3xl text-forest-deep">{HE.chat.title}</h1>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">{HE.legal.localOnly}</p>
      </header>

      <div className="flex flex-1 flex-col gap-3" aria-live="polite">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onShowReport={onShowReport} />
        ))}

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
            className="mt-3 min-h-11 rounded-full bg-clay px-5 py-2.5 text-white hover:bg-clay-deep"
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
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 py-2.5 text-white hover:bg-forest-deep"
      >
        {HE.chat.fullReport}
      </Link>
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
      <div className="flex flex-wrap gap-2" role="group" aria-label={question.promptHe}>
        {question.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${tapBtn} border border-line bg-card text-ink hover:bg-paper-deep`}
            onClick={() => onChoice(question, c)}
          >
            {c.labelHe}
          </button>
        ))}
      </div>
    );
  }

  if (question.kind === "search-institution") {
    const list = filterInstitutions(institutionQuery);
    return (
      <div className="space-y-3">
        {question.hintHe ? <p className="text-sm text-ink-soft">{question.hintHe}</p> : null}
        <label className="sr-only" htmlFor="chat-institution-search">
          {HE.chat.searchInstitution}
        </label>
        <input
          id="chat-institution-search"
          className="w-full min-h-11 rounded-xl border border-line bg-card px-3 py-2.5 text-ink"
          value={institutionQuery}
          onChange={(e) => onInstitutionQuery(e.target.value)}
          placeholder={HE.chat.searchInstitution}
          autoComplete="off"
        />
        {!institutionQuery.trim() ? (
          <p className="text-sm text-ink-soft">{HE.chat.popularInstitutions}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {list.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`${tapBtn} border border-line bg-card text-ink hover:bg-paper-deep`}
              onClick={() => onInstitution(i.id, i.nameHe)}
            >
              <HeWithEn text={i.nameHe} />
            </button>
          ))}
        </div>
        {!institutionQuery.trim() ? <p className="text-sm text-ink-soft">{HE.chat.moreHint}</p> : null}
      </div>
    );
  }

  if (question.kind === "search-city") {
    return (
      <div className="space-y-2">
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
        <p id="chat-city-label" className="sr-only">
          {question.promptHe}
        </p>
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={question.promptHe}>
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
        </div>
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
