import { type NextRequest, NextResponse } from "next/server";

import { getLaunchAt } from "@/content/launchGate";
import { env } from "@/env";
import { decideGate, gateEnabled } from "@/lib/gate/decide";
import { hasValidSession, SESSION_COOKIE } from "@/lib/gate/session";
import { defaultLocale, isLocale, languageCookie, type Locale, locales, localizedPath } from "@/lib/i18n/config";
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

/** Draft mode's cookie. Only an editor holding the Sanity preview secret can get it, which is what lets the Studio preview the site before launch. */
const DRAFT_MODE_COOKIE = "__prerender_bypass";

/**
 * Before launch the public sees only the splash, and `/dev` is for staff at all times. Returns the response that
 * stands in for the page, or `null` to carry on to the normal routing.
 */
async function gate(request: NextRequest): Promise<NextResponse | null> {
  const enabled = gateEnabled(env.SITE_GATE, env.VERCEL_ENV);
  if (!enabled) return null;
  const { pathname } = request.nextUrl;
  const decision = decideGate({
    enabled,
    launchAt: await getLaunchAt(),
    now: new Date(),
    hasSession: await hasValidSession(request.cookies.get(SESSION_COOKIE)?.value, env.AUTH_SECRET),
    hasDraftCookie: request.cookies.has(DRAFT_MODE_COOKIE),
    pathname,
  });
  if (decision === "open") return null;

  if (decision === "login") {
    const url = new URL("/api/auth/google", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}/launching`;
  url.search = "";
  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

// English is served unprefixed (`/about`) and rewritten to `/en/about` internally; every other
// locale keeps its visible prefix (`/ga/about`). The explicit `/en/...` form redirects to the
// canonical unprefixed URL so each page has one address. A prefixed URL is always honoured, since
// it is an explicit request; only an unprefixed one is sent on to the visitor's own language.
export async function proxy(request: NextRequest) {
  const gated = await gate(request);
  if (gated) return gated;

  const { pathname } = request.nextUrl;
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(locale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (locale) return NextResponse.next();

  // Only page loads move; a form post to the same URL must reach its action as sent.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- DETECT_LANGUAGE is a switch kept as a constant so it can be flipped
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
