import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Fraunces, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { InlineScript } from "@/components/InlineScript";
import { SanityChrome } from "@/components/sanity/SanityChrome";
import { isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import "../globals.css";

// Type pairing "Expressive": Fraunces for display, Manrope for text.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
});
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { site } = await getDictionary(lang);
  return {
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
    description: site.description,
  };
}

// Paint under the notch and home indicator (components pad themselves with env(safe-area-inset-*)),
// and colour the browser chrome to match the surface. Cinematic pages override this to always-dark.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0b0d" },
  ],
};

// Only Chromium renders SVG filters inside backdrop-filter, and only Chromium exposes
// navigator.userAgentData, so it doubles as the feature flag for liquid-glass lensing.
const glassRefractScript = `if("userAgentData"in navigator)document.documentElement.setAttribute("data-glass-refract","")`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={glassRefractScript} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Suspense>
          <SanityChrome />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
