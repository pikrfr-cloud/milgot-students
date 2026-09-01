import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "מלגות לסטודנטים — דוח זכאות מלא",
  description:
    "ממלאים פרופיל פעם אחת ומקבלים דוח מפורט: כל המלגות שעומדים בתנאיהן, מה חסר לאישור, ומה כמעט מתאים. בלי התחברות, הנתונים נשארים במכשיר.",
  applicationName: "מלגות לסטודנטים",
  icons: { icon: "/milgot-students/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e4a3a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a className="skip-link" href="#main">
          דילוג לתוכן
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
