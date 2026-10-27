import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { InlineScript } from "@/components/InlineScript";
import { SanityChrome } from "@/components/sanity/SanityChrome";
import "./globals.css";

// Type pairing "Expressive": Fraunces for display, Manrope for text.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
});
const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: {
    default: "Fiú Media",
    template: "%s · Fiú Media",
  },
  description: "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.",
};

// Only Chromium renders SVG filters inside backdrop-filter, and only Chromium exposes
// navigator.userAgentData, so it doubles as the feature flag for liquid-glass lensing.
const glassRefractScript = `if("userAgentData"in navigator)document.documentElement.setAttribute("data-glass-refract","")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
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
