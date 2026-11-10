import type { Metadata } from "next";
import { Suspense } from "react";

import { PageShell } from "@/components/ui/PageShell";
import { PageTitle } from "@/components/ui/PageTitle";
import { ContactLinks, getSiteSettings } from "@/content/siteSettings";
import { BulletList, PolicySection as Section, StorageGroup, WithLink } from "@/features/privacy";
import { formatLongDate } from "@/lib/dates";
import { dateLocale, getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { href, pageMetadata, routes } from "@/lib/routes";

/** Where a complaint to Ireland's data protection authority is made. */
const DPC_URL = "https://www.dataprotection.ie";

/** Bump when the policy's wording changes. */
const UPDATED = "2026-11-08";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { privacy } = await getDictionary(lang);
  return pageMetadata(lang, routes.privacy(), { title: privacy.title });
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await getLocale(params);
  const { privacy } = await getDictionary(lang);
  const date = formatLongDate(UPDATED, dateLocale[lang]);
  const { who, collect, why, providers, storage, retention, transfers, rights } = privacy;
  // A reading column: about 65 characters a line.
  return (
    <PageShell className="max-w-prose pb-16">
      <header className="mb-12">
        <PageTitle title={privacy.title} />
        <p className="mt-3 text-sm text-fg-muted">{format(privacy.updated, { date })}</p>
        <p className="mt-6 text-lg">{privacy.intro}</p>
      </header>
      <div className="space-y-10">
        <Section heading={who.heading}>
          <p>{who.body}</p>
        </Section>

        <Section heading={collect.heading}>
          <p>{collect.body}</p>
          <BulletList items={collect.items} />
        </Section>

        <Section heading={why.heading}>
          {why.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </Section>

        <Section heading={providers.heading}>
          <p>{providers.body}</p>
          <ul className="space-y-6 pt-2">
            {providers.items.map((provider) => (
              <li key={provider.name}>
                <h3 className="font-medium text-fg">{provider.name}</h3>
                <p className="mt-1">{provider.purpose}</p>
                <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {provider.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="link-inline">
                        {link.label}
                        <span className="sr-only"> ({privacy.opensInNewTab})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>

        <Section heading={storage.heading}>
          <p>{storage.body}</p>
          <StorageGroup title={storage.ours} items={storage.items} />
          <StorageGroup title={storage.theirs} items={storage.vimeoItems} />
        </Section>

        <Section heading={retention.heading}>
          <p>{retention.body}</p>
          <p>{retention.records}</p>
          <p>{retention.providersBody}</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-fg-muted">
            {retention.items.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-fg">{item.name}.</span> {item.text}
              </li>
            ))}
          </ul>
        </Section>

        <Section heading={transfers.heading}>
          <p>{transfers.body}</p>
        </Section>

        <Section heading={rights.heading}>
          <p>{rights.body}</p>
          <p>
            <WithLink
              text={rights.complaint}
              placeholder="{authority}"
              href={DPC_URL}
              label={rights.authority}
              newTab={privacy.opensInNewTab}
            />
          </p>
        </Section>

        <Section heading={privacy.contactHeading}>
          <p>{privacy.contactBody}</p>
          <p>
            <a href={href(lang, routes.contact())} className="link-inline">
              {privacy.contactForm}
            </a>
          </p>
          {/* Reads draft mode, so it streams in behind the rest of the page. */}
          <Suspense>
            <Email lang={lang} />
          </Suspense>
        </Section>
      </div>
    </PageShell>
  );
}

async function Email({ lang }: { lang: Locale }) {
  const [{ contact: links }, { contact }] = await Promise.all([getSiteSettings(lang), getDictionary(lang)]);
  return (
    <ContactLinks contact={links} labels={{ email: contact.emailLabel, instagram: contact.instagramLabel }} variant="list" />
  );
}
