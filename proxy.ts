import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, languageCookie, localizedPath, locales, type Locale } from "@/lib/i18n/config";
import { preferredLocale } from "@/lib/i18n/negotiate";

/** Turn off to stop sending visitors to the language their browser prefers (the switcher and cookie still work). */
const DETECT_LANGUAGE = true;

/**
 * The language to serve an unprefixed URL in: the visitor's explicit choice (the cookie the switcher
 * sets) if they made one, else the first supported language their browser asks for. A browser that
 * names none, which includes search crawlers, gets the default.
 */
function wantedLocale(request: NextRequest): Locale {
  const chosen = request.cookies.get(languageCookie)?.value;
  if (chosen && isLocale(chosen)) return chosen;
  return preferredLocale(request.headers.get("accept-language")) ?? defaultLocale;
}

// English is served unprefixed (`/about`) and rewritten to `/en/about` internally; every other
// locale keeps its visible prefix (`/ga/about`). The explicit `/en/...` form redirects to the
// canonical unprefixed URL so each page has one address. A prefixed URL is always honoured, since
// it is an explicit request; only an unprefixed one is sent on to the visitor's own language.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(locale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (locale) return NextResponse.next();

  // Only page loads move; a form post to the same URL must reach its action as sent.
  if (DETECT_LANGUAGE && (request.method === "GET" || request.method === "HEAD")) {
    const wanted = wantedLocale(request);
    if (wanted !== defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = localizedPath(wanted, pathname);
      // Temporary, and varying on what decided it, so no cache or browser keeps a visitor on the wrong side.
      const response = NextResponse.redirect(url, 307);
      response.headers.set("Vary", "Accept-Language, Cookie");
      return response;
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip the API, Next internals and anything that looks like a file (public assets, favicon).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
