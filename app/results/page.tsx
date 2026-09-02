import type { Metadata } from "next";
import { JsRequiredNote } from "@/components/ProfileLoadingFallback";
import { ResultsView } from "@/components/ResultsView";

export const metadata: Metadata = {
  title: "דוח הזכאות",
  description: "דוח ההתאמה לפי הפרופיל השמור במכשיר.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/results/" },
};

export default function ResultsPage() {
  return (
    <>
      <JsRequiredNote />
      <ResultsView />
    </>
  );
}
