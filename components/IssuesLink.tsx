import { ExternalLink } from "@/components/ExternalLink";
import { HE } from "@/lib/i18n/he";
import { githubNewIssueUrl } from "@/lib/github-issues";

export function IssuesLink({
  children,
  className = "",
  title,
  body,
  labels,
  template,
}: {
  children?: string;
  className?: string;
  title?: string;
  body?: string;
  labels?: string;
  template?: string;
}) {
  const prefilled = Boolean(title || body || labels || template);
  const href = prefilled
    ? githubNewIssueUrl({ title, body, labels, template })
    : HE.legal.githubIssuesUrl;
  return (
    <ExternalLink
      className={`underline underline-offset-4 ltr-isolate ${className}`}
      href={href}
    >
      {children ?? "כתבו לנו"}
    </ExternalLink>
  );
}
