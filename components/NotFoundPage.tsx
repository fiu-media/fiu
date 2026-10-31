import { SiteNav } from "@/components/nav/SiteNav";
import { railInset } from "@/components/nav/rail";
import { NotFoundBackLink } from "@/components/NotFoundBackLink";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getNavItems } from "@/lib/i18n/nav";

export type NotFoundCopy = { eyebrow: string; heading: string; body: string; home: string; backTo: string };

// English only for now; the Irish text comes from Fíu.
export const notFoundCopy: NotFoundCopy = {
  eyebrow: "404",
  heading: "Page not found",
  body: "That page doesn’t exist, or it has moved.",
  home: "Back home",
  backTo: "Back to {section}",
};

/**
 * The site's 404: always dark, a slowly drifting patch of light (the #51 experiment; still when motion
 * is reduced), the rail, a link back to the section the URL was under, or home. `className` sets the height; the default fills the viewport,
 * /dev/not-found fits it to a preview frame.
 */
export async function NotFoundPage({
  lang,
  copy = notFoundCopy,
  className = "min-h-dvh",
}: {
  lang: Locale;
  copy?: NotFoundCopy;
  className?: string;
}) {
  const dict = await getDictionary(lang);
  return (
    <div
      data-surface="cinematic"
      className={`relative isolate flex flex-col overflow-hidden bg-ink text-fg ${railInset} ${className}`}
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 h-[150%] w-3/4 animate-[light-drift_26s_ease-in-out_infinite_alternate] rounded-full bg-[radial-gradient(closest-side,rgb(214_160_110/0.38),transparent)] blur-3xl motion-reduce:animate-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>
      <SiteNav lang={lang} onImage />
      <main className="flex flex-1 flex-col justify-center gap-6 px-6 pt-24 pb-14 md:px-12 md:pt-0">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{copy.eyebrow}</p>
        <h1 className="font-display max-w-3xl text-5xl leading-[1.02] md:text-8xl">{copy.heading}</h1>
        <p className="max-w-md text-base text-fg-muted md:text-lg">{copy.body}</p>
        <div>
          <NotFoundBackLink lang={lang} home={copy.home} backTo={copy.backTo} sections={getNavItems(lang, dict)} />
        </div>
        <p className="font-display text-sm text-fg-muted italic">{dict.site.description}</p>
      </main>
    </div>
  );
}
