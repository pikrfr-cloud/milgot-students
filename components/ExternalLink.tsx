import type { ReactNode } from "react";

const NEW_TAB_HE = "נפתח בחלון חדש";

export function ExternalLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      {children}
      <span className="sr-only"> ({NEW_TAB_HE})</span>
    </a>
  );
}
