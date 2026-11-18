import { PageTitle } from "@/components/ui/PageTitle";
import type { Locale } from "@/lib/i18n/config";

/** A page's heading block: the title (with its optional Fiú line) and a short intro under it. */
export function PageHeader({
  title,
  tagline,
  taglineLang,
  intro,
  introLang,
  className,
}: {
  title: string;
  tagline?: string | null | undefined;
  intro?: string | null | undefined;
  /** Set when the tagline or intro is not in the page's language (an untranslated fallback). */
  taglineLang?: Locale | undefined;
  introLang?: Locale | undefined;
  className?: string | undefined;
}) {
  return (
    <header className={className}>
      <PageTitle title={title} tagline={tagline} taglineLang={taglineLang} />
      {intro && (
        <p lang={introLang} className="mt-4 max-w-2xl text-lg text-fg-muted">
          {intro}
        </p>
      )}
    </header>
  );
}
