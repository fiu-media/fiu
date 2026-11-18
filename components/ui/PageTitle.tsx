import { Fragment } from "react";

import type { Locale } from "@/lib/i18n/config";

/**
 * A page's <h1> with an optional playful "Fiú line" underneath. The plain title carries the meaning
 * for assistive tech, so the line is hidden from it, and "Fiú" is marked Irish for anyone who sees it.
 */
export function PageTitle({
  title,
  tagline,
  taglineLang,
}: {
  title: string;
  tagline?: string | null | undefined;
  /** Set when the tagline is not in the page's language (an untranslated fallback). */
  taglineLang?: Locale | undefined;
}) {
  return (
    <>
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      {tagline && (
        <p aria-hidden lang={taglineLang} className="mt-2 font-display text-2xl text-fg-muted italic md:text-3xl">
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
