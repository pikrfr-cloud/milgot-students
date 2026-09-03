import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatIntake } from "@/components/ChatIntake";
import { JsRequiredNote } from "@/components/ProfileLoadingFallback";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.chat.title,
  description: HE.chat.intro,
  alternates: { canonical: "/chat/" },
};

function ChatFirstPaintFallback() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col px-3 pb-4 pt-6 sm:px-4">
      <h1 className="font-display text-3xl text-forest-deep">{HE.chat.title}</h1>
      <p className="mt-2 text-base leading-relaxed text-ink">{HE.chat.intro}</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <JsRequiredNote />
      <Suspense fallback={<ChatFirstPaintFallback />}>
        <ChatIntake />
      </Suspense>
    </>
  );
}
