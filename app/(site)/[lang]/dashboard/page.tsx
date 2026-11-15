import type { LucideIcon } from "lucide-react";
import { Globe, LayoutTemplate } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  siGithub,
  siGoogle,
  siGooglecloud,
  siGooglesearchconsole,
  siInstagram,
  siResend,
  siSanity,
  siVercel,
  siVimeo,
} from "simple-icons";

import { BrandIcon } from "@/components/ui/BrandIcon";
import { GlassPanel, GlassPillButton, GlassPillLink } from "@/components/ui/Glass";
import { getSiteSettings } from "@/content/siteSettings";
import { env } from "@/env";
import { getStaffSession } from "@/lib/auth";
import { getLocale, type Locale, localizedPath } from "@/lib/i18n/config";
import { studioUrl } from "@/sanity/studio-env";

// Internal staff hub. Unlisted and kept out of search engines; the proxy sends visitors without a
// session to Google sign-in (same rule as `/concepts`).
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type DashLink = {
  href: string;
  title: string;
  note: string;
  icon: SimpleIcon | LucideIcon;
  external?: boolean;
};

/** GCP project number that owns the staff OAuth client (from the client ID prefix). */
const GOOGLE_CLOUD_PROJECT = "1049642711703";

function googleCloudCredentialsUrl(): string {
  const fromEnv = env.GOOGLE_CLIENT_ID?.split("-")[0];
  const project = fromEnv && /^\d+$/.test(fromEnv) ? fromEnv : GOOGLE_CLOUD_PROJECT;
  return `https://console.cloud.google.com/apis/credentials?project=${project}`;
}

function isSimpleIcon(icon: SimpleIcon | LucideIcon): icon is SimpleIcon {
  return "path" in icon && typeof icon.path === "string";
}

function tools(instagram: { href: string; handle: string } | null): DashLink[] {
  const workspaceDomain = env.AUTH_ALLOWED_DOMAIN;

  return [
    {
      href: studioUrl,
      title: "Sanity Studio",
      note: "Edit projects, talent, rentals and site settings.",
      icon: siSanity,
      external: true,
    },
    {
      href: `https://www.sanity.io/manage/project/${env.NEXT_PUBLIC_SANITY_PROJECT_ID}`,
      title: "Sanity Manage",
      note: "Project members, API tokens, datasets and CORS origins.",
      icon: siSanity,
      external: true,
    },
    {
      href: "https://vercel.com/fiu-media/fiu",
      title: "Vercel",
      note: "Deployments, environment variables, firewall and BotID.",
      icon: siVercel,
      external: true,
    },
    {
      href: "https://vercel.com/fiu-media/fiu/analytics",
      title: "Vercel Analytics",
      note: "Web Analytics, Speed Insights and custom events.",
      icon: siVercel,
      external: true,
    },
    {
      href: "https://github.com/fiu-media/fiu",
      title: "GitHub",
      note: "Source, pull requests, Actions and Dependabot.",
      icon: siGithub,
      external: true,
    },
    {
      href: "https://resend.com/emails",
      title: "Resend",
      note: "Outbound mail and delivery logs from mail.fiú.ie.",
      icon: siResend,
      external: true,
    },
    {
      href: googleCloudCredentialsUrl(),
      title: "Google Cloud",
      note: "OAuth client used for staff sign-in on fiú.ie.",
      icon: siGooglecloud,
      external: true,
    },
    {
      href: `https://admin.google.com/?hd=${encodeURIComponent(workspaceDomain)}`,
      title: "Google Workspace",
      note: "fiú.ie accounts, groups and Workspace admin.",
      icon: siGoogle,
      external: true,
    },
    {
      href: `https://search.google.com/search-console?resource_id=${encodeURIComponent(`sc-domain:${workspaceDomain}`)}`,
      title: "Search Console",
      note: "Indexing, sitemaps and search performance for fiú.ie.",
      icon: siGooglesearchconsole,
      external: true,
    },
    {
      href: "https://vimeo.com/manage/videos",
      title: "Vimeo",
      note: "Library of films and player settings for Our Work.",
      icon: siVimeo,
      external: true,
    },
    ...(instagram
      ? [
          {
            href: instagram.href,
            title: "Instagram",
            note: `The ${instagram.handle} account linked from the site.`,
            icon: siInstagram,
            external: true,
          } satisfies DashLink,
        ]
      : []),
  ];
}

function siteLinks(lang: Locale): DashLink[] {
  return [
    {
      href: localizedPath(lang, "/concepts"),
      title: "Concepts",
      note: "Sign-off options and tuning playgrounds for the site.",
      icon: LayoutTemplate,
    },
    {
      href: localizedPath(lang, "/"),
      title: "View site",
      note: "Open the public site as a signed-in member of staff.",
      icon: Globe,
    },
  ];
}

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {
  const lang = await getLocale(params);
  const { contact } = await getSiteSettings(lang, { draft: false });

  return (
    <main data-surface="cinematic" className="min-h-dvh bg-ink text-fg">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <header className="mb-8 border-b border-line pb-6">
          <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">Fiú · internal</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Dashboard</h1>
          <Suspense fallback={<DashboardSessionFallback />}>
            <DashboardSession />
          </Suspense>
        </header>

        <LinkSection title="Tools" links={tools(contact.instagram)} />
        <LinkSection title="Site" links={siteLinks(lang)} className="mt-12" />
      </div>
    </main>
  );
}

function LinkSection({ title, links, className }: { title: string; links: DashLink[]; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-4 text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <DashLinkCard link={link} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DashLinkIcon({ icon }: { icon: SimpleIcon | LucideIcon }) {
  if (isSimpleIcon(icon)) return <BrandIcon icon={icon} className="size-5" />;
  const Icon = icon;
  return <Icon aria-hidden className="size-5" strokeWidth={1.75} />;
}

function DashLinkCard({ link }: { link: DashLink }) {
  const kind = link.external ? "External" : "Internal";
  const body = (
    <GlassPanel onImage className="h-full p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{kind}</p>
        <span className="text-fg-muted">
          <DashLinkIcon icon={link.icon} />
        </span>
      </div>
      <h3 className="mt-3 font-display text-2xl md:text-3xl">{link.title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{link.note}</p>
    </GlassPanel>
  );

  if (link.external) {
    return (
      <a href={link.href} className="block h-full rounded-[28px]" rel="noreferrer" target="_blank">
        {body}
      </a>
    );
  }

  return (
    <Link href={link.href} className="block h-full rounded-[28px]">
      {body}
    </Link>
  );
}

function DashboardSessionFallback() {
  return (
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
      <p className="max-w-2xl text-sm text-fg-muted">Staff tools for Fiú. Unlisted and kept out of search engines.</p>
      <span className="inline-block h-8 w-24 rounded-full bg-fg/10" aria-hidden />
    </div>
  );
}

async function DashboardSession() {
  const session = await getStaffSession(await headers());
  const user = session?.user;
  const trimmedName = user?.name.trim();
  const displayName = trimmedName !== undefined && trimmedName !== "" ? trimmedName : user?.email;

  return (
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
      <p className="max-w-2xl text-sm text-fg-muted">
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
    </div>
  );
}
