import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatIntake } from "@/components/ChatIntake";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.chat.title,
  description: "שיחה קצרה — שאלה אחת בכל פעם. הנתונים נשמרים במכשיר בלבד.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/chat/" },
};

export default function ChatPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-ink-soft">{HE.profile.loading}</p>}>
      <ChatIntake />
    </Suspense>
  );
}
