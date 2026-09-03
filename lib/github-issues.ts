import { HE } from "@/lib/i18n/he";

export const REPORT_ERROR_TEMPLATE = "report-error.yml";
export const REPORT_ERROR_LABEL = "bug";
export const REPORT_ERROR_TITLE_HE = "דיווח על טעות";
export const REPORT_ERROR_BODY_HE = `מה לא נכון?

איזה עמוד או מלגה?

(בלי שם, תמונה או פרטי תשלום.)
`;

export function githubNewIssueUrl(opts: {
  template?: string;
  title?: string;
  body?: string;
  labels?: string;
}): string {
  const url = new URL(`${HE.legal.githubIssuesUrl}/new`);
  if (opts.template) url.searchParams.set("template", opts.template);
  if (opts.title) url.searchParams.set("title", opts.title);
  if (opts.body) url.searchParams.set("body", opts.body);
  if (opts.labels) url.searchParams.set("labels", opts.labels);
  return url.toString();
}

export function reportErrorIssueUrl(): string {
  return githubNewIssueUrl({
    template: REPORT_ERROR_TEMPLATE,
    title: REPORT_ERROR_TITLE_HE,
    body: REPORT_ERROR_BODY_HE,
    labels: REPORT_ERROR_LABEL,
  });
}
