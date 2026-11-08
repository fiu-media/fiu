import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { pageGutter } from "@/components/layout/nav/rail";
import { PageTitle } from "@/components/ui/PageTitle";
import { CONTACT_SETTINGS_QUERY } from "@/content/siteSettings";
import { cn } from "@/lib/cn";
import { emailForDisplay } from "@/lib/email/display";
import { defaultLocale, isLocale, languageAlternates, type Locale, localizedPath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";

/** Where a complaint to Ireland's data protection authority is made. */
const DPC_URL = "https://www.dataprotection.ie";

/** Bump when the policy's wording changes. */
const UPDATED = "2026-11-08";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { privacy } = await getDictionary(lang);
  return { title: privacy.title, alternates: languageAlternates(lang, "/privacy") };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { privacy } = await getDictionary(lang);
  const date = new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString(lang, { dateStyle: "long", timeZone: "UTC" });
  const { who, collect, why, providers, storage, retention, transfers, rights } = privacy;
  return (
    <main className={cn("mx-auto max-w-3xl pb-16", pageGutter)}>
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
          <ul className="space-y-2">
            <li>
              <a href={localizedPath(lang, "/contact")} className="link-inline">
                {privacy.contactForm}
              </a>
            </li>
            {/* Reads draft mode, so it streams in behind the rest of the page. */}
            <Suspense>
              <Email lang={lang} />
            </Suspense>
          </ul>
        </Section>
      </div>
    </main>
  );
}

/** `text` with `placeholder` replaced by an external link, so a translation can put the link wherever its grammar wants it. */
function WithLink({
  text,
  placeholder,
  href,
  label,
  newTab,
}: {
  text: string;
  placeholder: string;
  href: string;
  label: string;
  newTab: string;
}) {
  const [before, after = ""] = text.split(placeholder);
  return (
    <>
      {before}
      <a href={href} target="_blank" rel="noopener noreferrer" className="link-inline">
        {label}
        <span className="sr-only"> ({newTab})</span>
      </a>
      {after}
    </>
  );
}

/** A titled block of running text. */
function Section({ heading, children }: { heading: string; children: ReactNode }) {
  const id = slug(heading);
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-2xl">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-fg-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

type StorageEntry = { name: string; type: string; lasts: string; description: string };

/** What a site stores in the browser, one entry per cookie or key: its name as code, then what it is for. */
function StorageGroup({ title, items }: { title: string; items: readonly StorageEntry[] }) {
  return (
    <div className="pt-2">
      <h3 className="font-medium text-fg">{title}</h3>
      <dl className="mt-3 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <div key={item.name} className="py-4">
            <dt className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <code className="rounded-md bg-bg-raised px-2 py-0.5 font-mono text-sm text-fg">{item.name}</code>
              <span className="text-sm text-fg-muted">
                {item.type} · {item.lasts}
              </span>
            </dt>
            <dd className="mt-2">{item.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** A heading as an id: "Who handles it for us" → "who-handles-it-for-us". */
const slug = (heading: string) =>
  `privacy-${heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")}`;

async function Email({ lang }: { lang: Locale }) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: CONTACT_SETTINGS_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  if (!data?.contactEmail) return null;
  const email = emailForDisplay(data.contactEmail);
  return (
    <li>
      <a href={`mailto:${email}`} className="link-inline">
        {email}
      </a>
    </li>
  );
}
