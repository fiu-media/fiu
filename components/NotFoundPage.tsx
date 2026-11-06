import { SiteNav } from "@/components/nav/SiteNav";
import { pageGutter, railInset } from "@/components/nav/rail";
import { NotFoundBackLink } from "@/components/NotFoundBackLink";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getNavItems } from "@/lib/i18n/nav";

export type NotFoundCopy = Dictionary["notFound"];

/**
 * The site's 404: always dark, two slowly wandering lights (the #51 experiment; still when motion is
 * reduced), the rail, and a link back to the section the URL was under, or home. `className` sets the
 * height; the default fills the viewport, /dev/not-found fits it to a preview frame.
 */
export async function NotFoundPage({
  lang,
  copy,
  className = "min-h-dvh",
}: {
  lang: Locale;
  copy?: NotFoundCopy;
  className?: string;
}) {
  const dict = await getDictionary(lang);
  copy ??= dict.notFound;
  return (
    <div
      data-surface="cinematic"
      className={cn("relative isolate flex flex-col overflow-hidden bg-ink text-fg", railInset, className)}
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 h-[150%] w-3/4 animate-[light-drift_32s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgb(214_160_110/0.5),transparent)] blur-3xl motion-reduce:animate-none" />
        <div className="absolute -bottom-1/4 left-1/2 h-[110%] w-1/2 animate-[light-drift-b_47s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgb(196_120_110/0.32),transparent)] blur-3xl motion-reduce:animate-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>
      <SiteNav lang={lang} onImage />
      <main className={cn("flex flex-1 flex-col justify-center gap-6 pt-24 pb-14 md:pt-0", pageGutter)}>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="max-w-3xl font-display text-5xl leading-[1.02] md:text-8xl">{copy.heading}</h1>
        <p className="max-w-md text-base text-fg-muted md:text-lg">{copy.body}</p>
        <div>
          <NotFoundBackLink lang={lang} home={copy.home} backTo={copy.backTo} sections={getNavItems(lang, dict)} />
        </div>
        <p className="font-display text-sm text-fg-muted italic">{dict.site.description}</p>
      </main>
    </div>
  );
}
