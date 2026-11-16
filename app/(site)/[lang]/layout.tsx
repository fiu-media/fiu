import "../globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";

import { InlineScript } from "@/components/layout/InlineScript";
import { SanityChrome } from "@/components/sanity/SanityChrome";
import { getSiteDefaults } from "@/features/site";
import { getLocale, locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/siteUrl";
import { INK } from "@/lib/theme";

// Type pairing "Expressive": Fraunces for display, Manrope for text.
// `subsets` only picks the files to preload: every subset stays in the CSS and loads when a page uses its characters.
// Latin covers English and Irish (the fadas are in it), so only that is preloaded; the extended file (names like
// Łukasz or Zoë's ő) costs as much again and would compete with the first screen for nothing on most pages.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { name, title, description } = await getSiteDefaults(lang);
  return {
    // Canonicals, hreflang links and share images are written as paths; this makes them absolute.
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${name}`,
    },
    description,
  };
}

// Paint under the notch and home indicator (components pad themselves with env(safe-area-inset-*)),
// and colour the browser chrome to match the always-dark site.
export const viewport: Viewport = { viewportFit: "cover", themeColor: INK };

// Only Chromium renders SVG filters inside backdrop-filter, and only Chromium exposes
// navigator.userAgentData, so it doubles as the feature flag for liquid-glass lensing.
const glassRefractScript = `if("userAgentData"in navigator)document.documentElement.setAttribute("data-glass-refract","")`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await getLocale(params);
  return (
    <html lang={lang} className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={glassRefractScript} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
        <Suspense>
          <SanityChrome />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
