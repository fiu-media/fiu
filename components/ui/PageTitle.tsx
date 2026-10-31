import { Fragment } from "react";

/**
 * A page's <h1> with an optional playful "Fiú line" underneath. The plain title carries the meaning
 * for assistive tech, so the line is hidden from it, and "Fiú" is marked Irish for anyone who sees it.
 */
export function PageTitle({ title, tagline }: { title: string; tagline?: string | null }) {
  return (
    <>
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      {tagline && (
        <p aria-hidden className="mt-2 font-display text-2xl italic text-fg-muted md:text-3xl">
          {tagline.split(/(Fiú)/g).map((part, i) =>
            part === "Fiú" ? (
              <span key={i} lang="ga">
                {part}
              </span>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            ),
          )}
        </p>
      )}
    </>
  );
}
