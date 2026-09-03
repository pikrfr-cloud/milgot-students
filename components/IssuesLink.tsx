import { ExternalLink } from "@/components/ExternalLink";
import { HE } from "@/lib/i18n/he";

export function IssuesLink({
  children,
  className = "",
}: {
  children?: string;
  className?: string;
}) {
  return (
    <ExternalLink
      className={`underline underline-offset-4 ltr-isolate ${className}`}
      href={HE.legal.githubIssuesUrl}
    >
      {children ?? "כתבו לנו"}
    </ExternalLink>
  );
}
