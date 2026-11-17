import type { Metadata } from "next";
import { Suspense } from "react";

import { FormSkeleton } from "@/components/forms/FormSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContactLinks, getSiteSettings } from "@/content/siteSettings";
import { siteMetadata } from "@/features/site";
import { countryList } from "@/lib/forms/countries";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { routes } from "@/lib/routes";

import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = await getLocale(params);
  const [{ contact }, { contactIntro }] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return siteMetadata(lang, routes.contact(), { title: contact.title, description: contactIntro ?? undefined });
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const lang = await getLocale(params);
  const [{ contact, forms, common }, { contactTagline, contactIntro }] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    // Header, direct contact, form on phones, so a visitor who'd rather email sees it first; two columns from lg.
    <PageShell className="grid gap-x-12 gap-y-10 lg:grid-cols-[3fr_2fr]">
      <PageHeader
        title={contact.title}
        tagline={contactTagline}
        intro={contactIntro}
        className="order-1 lg:order-none lg:col-start-1 lg:row-start-1"
      />
      <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2">
        {/* ContactForm reads the ?type= query, which needs a boundary to keep the page static. */}
        <Suspense fallback={<FormSkeleton label={common.loading} fields={3} />}>
          <ContactForm lang={lang} dict={{ contact, forms }} countries={countryList(lang)} />
        </Suspense>
      </div>
      <Suspense fallback={<DirectContactSkeleton />}>
        <DirectContact lang={lang} />
      </Suspense>
    </PageShell>
  );
}

async function DirectContact({ lang }: { lang: Locale }) {
  const [{ contact: labels, contactLinks }, { contact }] = await Promise.all([getDictionary(lang), getSiteSettings(lang)]);
  if (!contact.email && !contact.instagram) return null;

  return (
    <aside
      aria-labelledby="direct-contact"
      className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-28"
    >
      <h2 id="direct-contact" className="font-display text-2xl">
        {labels.directHeading}
      </h2>
      <ContactLinks contact={contact} labels={contactLinks} variant="definitions" />
    </aside>
  );
}

function DirectContactSkeleton() {
  return (
    <div aria-hidden className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-28">
      <Skeleton className="h-8 w-40" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
