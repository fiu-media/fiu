import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassPanel } from "@/components/ui/Glass";
import { isLocale, localizedPath } from "@/lib/i18n/config";

// Index of the unlisted /dev surfaces, so every ongoing concept is one click away. Kept out of
// search engines, like the pages it links to.
export const metadata: Metadata = {
  title: "Dev",
  robots: { index: false, follow: false },
};

type Concept = { href: string; title: string; kind: "Sign-off" | "Tuning"; note: string };

// Add a new /dev page here when it's created.
const concepts: Concept[] = [
  {
    href: "/dev/navbar",
    title: "Navbar options",
    kind: "Sign-off",
    note: "Five navbar concepts (capsule, type only, logo as the menu, floating dock, side rail) on dark and light surfaces, at desktop and phone widths.",
  },
  {
    href: "/dev/grids",
    title: "Grid options",
    kind: "Sign-off",
    note: "Layout options for the Our Work and Talent grids on placeholder content (issue #9).",
  },
  {
    href: "/dev/about",
    title: "About layout options",
    kind: "Sign-off",
    note: "Six layouts for the About page (slogan first, split screen, letterbox, poster, statement, glass caption) on the real still and slogan (issue #55).",
  },
  {
    href: "/dev/not-found",
    title: "404 options",
    kind: "Sign-off",
    note: "Three layouts for the custom not-found page (cinematic with a still, adaptive type only, cinematic with moving light) and two copy sets (issue #56).",
  },
  {
    href: "/dev/specimen",
    title: "Design specimen",
    kind: "Sign-off",
    note: "Living reference for the theme: type (Fraunces + Manrope), cinematic and adaptive surfaces, and liquid glass.",
  },
  {
    href: "/dev/logo-playground",
    title: "Logo playground",
    kind: "Tuning",
    note: "Tuning surface for the glass logo over the home hero stills, with a diff viewer.",
  },
];

export default async function DevIndexPage({ params }: PageProps<"/[lang]/dev">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <header className="mb-8 border-b border-line pb-6">
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Fiú · dev</p>
          <h1 className="font-display mt-2 text-4xl md:text-5xl">Concepts</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Everything we&rsquo;re still deciding or tuning. Unlisted and kept out of search engines.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {concepts.map((concept) => (
            <li key={concept.href}>
              <Link href={localizedPath(lang, concept.href)} className="block h-full rounded-[28px]">
                <GlassPanel onImage className="h-full p-6">
                  <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{concept.kind}</p>
                  <h2 className="font-display mt-2 text-2xl md:text-3xl">{concept.title}</h2>
                  <p className="mt-2 text-sm text-fg-muted">{concept.note}</p>
                </GlassPanel>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
