import type { Metadata } from "next";
import { Suspense } from "react";

import { FormSkeleton } from "@/components/forms/FormSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContactLinks, getSiteSettings } from "@/content/siteSettings";
import { countryList } from "@/lib/forms/countries";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMetadata, routes } from "@/lib/routes";

import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = await getLocale(params);
  const [{ contact }, { contactIntro }] = await Promise.all([getDictionary(lang), getSiteSettings(lang, { draft: false })]);
  return pageMetadata(lang, routes.contact(), { title: contact.title, description: contactIntro ?? undefined });
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const lang = await getLocale(params);
  const [{ contact, forms, common }, { contactTagline, contactIntro }] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <PageShell className="grid gap-12 lg:grid-cols-[3fr_2fr]">
      <div>
        <PageHeader title={contact.title} tagline={contactTagline} intro={contactIntro} className="mb-10" />
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
  const [{ contact: labels }, { contact }] = await Promise.all([getDictionary(lang), getSiteSettings(lang)]);
  if (!contact.email && !contact.instagram) return null;

  return (
    <aside aria-labelledby="direct-contact" className="lg:pt-28">
      <h2 id="direct-contact" className="font-display text-2xl">
        {labels.directHeading}
      </h2>
      <ContactLinks
        contact={contact}
        labels={{ email: labels.emailLabel, instagram: labels.instagramLabel }}
        variant="definitions"
      />
    </aside>
  );
}

function DirectContactSkeleton() {
  return (
    <div aria-hidden className="lg:pt-28">
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
