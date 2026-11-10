import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { pageGutter } from "@/components/layout/nav/rail";
import { ContactLinks, getSiteSettings } from "@/content/siteSettings";
import { cn } from "@/lib/cn";
import { type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";

/**
 * The slim footer under every page: "Fiú Media © 2026", the studio email, Instagram and Privacy. It is one quiet row, not a
 * sitemap: the nav is always on screen. `snap-end` keeps it reachable on pages that snap to their slides.
 */
export async function SiteFooter({ lang }: { lang: Locale }) {
  const { footer } = await getDictionary(lang);
  const copyright = format(footer.copyright, { year: "" }).trim();
  return (
    <footer
      className={cn(
        "snap-end pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-fg-muted max-md:pb-[max(6rem,env(safe-area-inset-bottom))]",
        pageGutter,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-8 gap-y-2">
        <p>
          <Suspense fallback={copyright}>
            <Year copyright={footer.copyright} />
          </Suspense>
        </p>
        {/* Reads draft mode, so it streams in after the copyright. */}
        <Suspense>
          <FooterLinks lang={lang} labels={{ email: footer.emailLabel, instagram: footer.instagramLabel }} />
        </Suspense>
        <Link href={localizedPath(lang, "/privacy")} className="link-inline">
          {footer.privacy}
        </Link>
      </div>
    </footer>
  );
}

/** The year needs the current time, which Cache Components only allows past a request boundary. */
async function Year({ copyright }: { copyright: string }) {
  await connection();
  return format(copyright, { year: new Date().getFullYear() });
}

async function FooterLinks({ lang, labels }: { lang: Locale; labels: { email: string; instagram: string } }) {
  const { contact } = await getSiteSettings(lang);
  return <ContactLinks contact={contact} labels={labels} variant="inline" />;
}
