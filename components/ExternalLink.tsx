import type { ReactNode } from "react";

const NEW_TAB_HE = "נפתח בחלון חדש";

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> ({NEW_TAB_HE})</span>
    </a>
  );
}
