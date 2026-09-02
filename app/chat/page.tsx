import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatIntake } from "@/components/ChatIntake";
import { JsRequiredNote, ProfileLoadingFallback } from "@/components/ProfileLoadingFallback";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.chat.title,
  description: "שיחה קצרה — שאלה אחת בכל פעם. הנתונים נשמרים במכשיר בלבד.",
  alternates: { canonical: "/chat/" },
};

export default function ChatPage() {
  return (
    <>
      <JsRequiredNote />
      <Suspense fallback={<ProfileLoadingFallback />}>
        <ChatIntake />
      </Suspense>
    </>
  );
}
