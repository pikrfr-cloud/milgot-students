import { Fragment, type ReactNode } from "react";

const LATIN = /([A-Za-z][A-Za-z0-9+./-]*)/g;

/** Wrap Latin fragments (HIT, SCE, STEM, PDF, …) for mixed RTL text. */
export function HeWithEn({ text }: { text: string }): ReactNode {
  const parts = text.split(LATIN);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <bdi key={i} lang="en">
        {part}
      </bdi>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
