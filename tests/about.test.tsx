import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";
import { COUNTS } from "@/data/counts";
import { CATALOG_STATS } from "@/data/scholarships";
import { formatHebrewLongDate } from "@/lib/format";
import {
  REPORT_ERROR_LABEL,
  REPORT_ERROR_TEMPLATE,
  REPORT_ERROR_TITLE_HE,
  reportErrorIssueUrl,
} from "@/lib/github-issues";
import { HE } from "@/lib/i18n/he";

describe("about verification and report-an-error", () => {
  it("explains official-source checks with the real catalog verification date", () => {
    const html = renderToStaticMarkup(<AboutPage />);
    const verifiedHe = formatHebrewLongDate(COUNTS.lastVerifiedMonth);
    expect(verifiedHe).toBeTruthy();
    expect(COUNTS.lastVerifiedMonth).toBe(CATALOG_STATS.lastVerifiedMonth);
    expect(html).toContain("כל מלגה בקטלוג נבדקה מול מקור רשמי");
    expect(html).toContain(verifiedHe!);
    expect(html).toContain(`${COUNTS.matchable} מלגות`);
    expect(html).toContain(HE.legal.githubRepoUrl.replace("https://", ""));
    expect(html).toContain("דווחו על טעות");
    expect(html).not.toMatch(/ח\.פ|פיקרפר/);
  });

  it("opens a GitHub issue with template, title, body and labels", () => {
    const url = new URL(reportErrorIssueUrl());
    expect(url.origin + url.pathname).toBe("https://github.com/pikrfr-cloud/milgot-students/issues/new");
    expect(url.searchParams.get("template")).toBe(REPORT_ERROR_TEMPLATE);
    expect(url.searchParams.get("title")).toBe(REPORT_ERROR_TITLE_HE);
    expect(url.searchParams.get("labels")).toBe(REPORT_ERROR_LABEL);
    expect(url.searchParams.get("body")).toContain("מה לא נכון?");

    const html = renderToStaticMarkup(<AboutPage />);
    expect(html).toContain("template=report-error.yml");
    expect(html).toContain("labels=bug");

    const template = readFileSync(join(process.cwd(), ".github/ISSUE_TEMPLATE/report-error.yml"), "utf8");
    expect(template).toContain("דיווח על טעות");
    expect(template).toContain("מה לא נכון?");
    expect(template).not.toMatch(/ח\.פ/);
  });
});
