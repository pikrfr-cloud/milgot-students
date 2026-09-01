import type { Metadata } from "next";
import { MyListView } from "@/components/MyListView";
import { HE } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: HE.nav.myList,
  description: "מעקב מלגות, מועדים ומסמכים — נשמר במכשיר בלבד.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/my-list/" },
};

export default function MyListPage() {
  return <MyListView />;
}
