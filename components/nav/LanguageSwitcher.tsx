"use client";

import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { languageCookie, localeNames, locales, switchLocalePath, type Locale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Remembers the choice, so the browser's preference stops deciding which language an unprefixed URL opens in. */
function rememberLanguage(lang: Locale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${languageCookie}=${lang}; path=/; max-age=${ONE_YEAR}; samesite=lax${secure}`;
}

/**
 * Switches the current page between the site's languages: bare codes with a hairline between them. The code is
 * what is on screen, and the language's own name follows it for screen readers, so the accessible name still
 * contains the visible text. Choosing one remembers it.
 */
export function LanguageSwitcher({
  lang,
  pathname,
  label,
  variant,
  className,
}: {
  lang: Locale;
  pathname: string;
  label: string;
  variant: "rail" | "menu";
  className?: string;
}) {
  const rail = variant === "rail";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex items-center", rail ? "flex-col gap-2 text-xs" : "gap-4 text-base", className)}
    >
      {locales.map((locale, index) => (
        <Fragment key={locale}>
          {index > 0 && <span aria-hidden className={cn("bg-fg/25", rail ? "h-px w-3" : "h-3 w-px")} />}
          <Link
            href={switchLocalePath(pathname, locale)}
            // A prefetch would be sent before the choice is remembered, so it would come back redirected to the old language.
            prefetch={false}
            lang={locale}
            hrefLang={locale}
            aria-current={locale === lang ? "true" : undefined}
            onClick={() => rememberLanguage(locale)}
            className="rounded-sm font-medium tracking-[0.14em] text-fg/50 hover:text-fg aria-[current=true]:text-fg"
          >
            {locale.toUpperCase()}
            <span className="sr-only">, {localeNames[locale]}</span>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
