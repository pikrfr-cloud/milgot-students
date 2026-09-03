import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AnalyticsScript } from "@/components/AnalyticsScript";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Providers } from "@/components/Providers";
import { HE } from "@/lib/i18n/he";
import "./globals.css";

const SITE = "https://pikrfr-cloud.github.io/milgot-students";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: `${HE.siteName} — ${HE.tagline}`,
    template: `%s · ${HE.siteName}`,
  },
  description: "ממלאים פעם אחת ומקבלים את המלגות שמתאימות — עם הסבר על כל אחת.",
  applicationName: HE.siteName,
  icons: { icon: "/milgot-students/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: HE.siteName,
    title: `${HE.siteName} — ${HE.tagline}`,
    description: "ממלאים פעם אחת ומקבלים את המלגות שמתאימות.",
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: HE.siteName }],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e4a3a",
};

type LayoutProps = { children: ReactNode };

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <a className="skip-link" href="#main">
          {HE.skipToContent}
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </Providers>
        <AnalyticsScript />
      </body>
    </html>
  );
}
