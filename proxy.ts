import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n/config";

// English is served unprefixed (`/about`) and rewritten to `/en/about` internally; every other
// locale keeps its visible prefix (`/ga/about`). The explicit `/en/...` form redirects to the
// canonical unprefixed URL so each page has one address.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(locale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (locale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip the API, the Studio, Next internals and anything that looks like a file (public assets, favicon).
  matcher: ["/((?!api|studio|_next|_vercel|.*\\..*).*)"],
};
