import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { GlassPanel, GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { getStaffSession } from "@/lib/auth";
import { getLocale, localizedPath } from "@/lib/i18n/config";
import { studioUrl } from "@/sanity/studio-env";

// Internal staff hub. Unlisted and kept out of search engines; the proxy sends visitors without a
// session to Google sign-in (same rule as `/dev`).
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type LinkCard = { href: string; title: string; note: string; external?: boolean };

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {
  const lang = await getLocale(params);

  const session = await getStaffSession(await headers());
  const user = session?.user;
  const trimmedName = user?.name.trim();
  const displayName = trimmedName !== undefined && trimmedName !== "" ? trimmedName : user?.email;

  const links: LinkCard[] = [
    {
      href: studioUrl,
      title: "Sanity Studio",
      note: "Edit projects, talent, rentals and site settings.",
      external: true,
    },
    {
      href: localizedPath(lang, "/dev"),
      title: "Dev concepts",
      note: "Sign-off options and tuning playgrounds for the site.",
    },
    {
      href: localizedPath(lang, "/"),
      title: "View site",
      note: "Open the public site as a signed-in member of staff.",
    },
  ];

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Fiú · internal</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {displayName ? (
                <>
                  Signed in as <span className="text-fg">{displayName}</span>
                  {user?.email && user.name ? <span className="text-fg-muted"> ({user.email})</span> : null}.
                </>
              ) : (
                <>Staff tools for Fiú.</>
              )}{" "}
              Unlisted and kept out of search engines.
            </p>
          </div>
          {session ? (
            <form action="/api/auth/signout" method="post">
              <GlassPillButton type="submit" onImage size="sm">
                Sign out
              </GlassPillButton>
            </form>
          ) : (
            <GlassPillLink href="/login" onImage size="sm">
              Sign in
            </GlassPillLink>
          )}
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href} className="block h-full rounded-[28px]" rel="noreferrer" target="_blank">
                  <GlassPanel onImage className="h-full p-6">
                    <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">External</p>
                    <h2 className="mt-2 font-display text-2xl md:text-3xl">{link.title}</h2>
                    <p className="mt-2 text-sm text-fg-muted">{link.note}</p>
                  </GlassPanel>
                </a>
              ) : (
                <Link href={link.href} className="block h-full rounded-[28px]">
                  <GlassPanel onImage className="h-full p-6">
                    <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Internal</p>
                    <h2 className="mt-2 font-display text-2xl md:text-3xl">{link.title}</h2>
                    <p className="mt-2 text-sm text-fg-muted">{link.note}</p>
                  </GlassPanel>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
