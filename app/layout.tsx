import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { InlineScript } from "@/components/InlineScript";
import "./globals.css";

// Placeholder text face until a pairing is chosen from /dev/specimen.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-text",
});

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <InlineScript html={glassRefractScript} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
