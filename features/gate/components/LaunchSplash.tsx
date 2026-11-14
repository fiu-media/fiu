import Image from "next/image";

import { LanguageSwitcher } from "@/components/layout/nav/LanguageSwitcher";
import { logo } from "@/lib/brand";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  lang: Locale;
  languageLabel: string;
  /** The site's name, for assistive tech. */
  name: string;
  /** The launch date, already formatted. Absent when none is set, and then the logo stands alone. */
  date: string | null;
  /** The Irish slogan, as the editors wrote it. */
  slogan: string | null;
  email: string | null;
  emailLabel: string;
};

/**
 * What the public sees before launch: the logo, the date it opens (no label: a date under a logo reads as the launch) and the slogan, centred and quiet, with the studio's
 * email at the foot. The logo leads; the date is the only thing to read, so it is the only large type.
 */
export function LaunchSplash({ lang, languageLabel, name, date, slogan, email, emailLabel }: Props) {
  return (
    <main
      data-surface="cinematic"
      className="relative flex min-h-dvh flex-col items-center bg-ink px-5 pt-[env(safe-area-inset-top)] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-fg"
    >
      {/* Every URL shows this same page before launch, so the switcher goes to the other language's root. */}
      <LanguageSwitcher
        lang={lang}
        pathname="/"
        label={languageLabel}
        variant="menu"
        className="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-2 gap-0 text-sm md:top-6 md:right-8 [&_a]:inline-block [&_a]:p-3"
      />
      <div className="my-auto flex flex-col items-center py-16">
        <Image
          src={logo}
          alt=""
          priority
          sizes="(min-width: 768px) 26vw, 56vw"
          className="h-auto w-[56vw] max-w-[380px] md:w-[26vw]"
        />
        <h1 className={cn("font-display text-2xl text-balance md:text-3xl", date && "mt-10 md:mt-12")}>
          <span className="sr-only">{name}</span>
          {date && (
            <>
              <span className="sr-only">: </span>
              {date}
            </>
          )}
        </h1>
        {slogan && (
          <p
            lang="ga"
            className="mt-5 max-w-[26ch] font-display text-base text-balance text-fg-muted italic md:max-w-none md:text-lg"
          >
            {slogan}
          </p>
        )}
      </div>
      {email && (
        <a href={`mailto:${email}`} className="py-3 text-sm text-fg-muted link-inline">
          <span className="sr-only">{emailLabel}: </span>
          {email}
        </a>
      )}
    </main>
  );
}
