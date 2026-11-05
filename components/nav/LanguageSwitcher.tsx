"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { languageCookie, localeNames, locales, switchLocalePath, type Locale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Remembers the choice, so the browser's preference stops deciding which language an unprefixed URL opens in. */
function rememberLanguage(lang: Locale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${languageCookie}=${lang}; path=/; max-age=${ONE_YEAR}; samesite=lax${secure}`;
}

/**
 * Switches the current page between the site's languages. Each link shows the language's own name, in that
 * language, so it reads correctly and its accessible name matches what is on screen. Choosing one remembers it.
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
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex items-center", variant === "rail" ? "flex-col gap-3 text-xs" : "gap-6 text-lg", className)}
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={switchLocalePath(pathname, locale)}
          // A prefetch would be sent before the choice is remembered, so it would come back redirected to the old language.
          prefetch={false}
          lang={locale}
          hrefLang={locale}
          aria-current={locale === lang ? "true" : undefined}
          onClick={() => rememberLanguage(locale)}
          className="rounded-sm font-medium tracking-wide text-fg/60 underline-offset-4 hover:text-fg aria-[current=true]:text-fg aria-[current=true]:underline"
        >
          {localeNames[locale]}
        </Link>
      ))}
    </div>
  );
}
