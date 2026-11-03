import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siInstagram } from "simple-icons";
import { Suspense, type ComponentProps } from "react";
import { pageGutter } from "@/components/nav/rail";
import { FormSkeleton } from "@/components/forms/FormSkeleton";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { PageTitle } from "@/components/ui/PageTitle";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { defaultLocale, isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { instagramHandle } from "@/lib/instagram";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { getPageText } from "@/sanity/lib/pageText";
import { CONTACT_SETTINGS_QUERY, TALENT_OPTIONS_QUERY } from "@/sanity/lib/queries";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const [{ contact }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return { title: contact.title, description: text.contactIntro ?? undefined, alternates: languageAlternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ contact, forms, common }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main className={cn("mx-auto grid max-w-6xl gap-12 pb-32 lg:grid-cols-[3fr_2fr]", pageGutter)}>
      <div>
        <header className="mb-10">
          <PageTitle title={contact.title} tagline={text.contactTagline} />
          {text.contactIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.contactIntro}</p>}
        </header>
        {/* ContactForm reads the ?type= query, which needs a boundary to keep the page static. */}
        <Suspense fallback={<FormSkeleton label={common.loading} fields={3} />}>
          <ContactFormWithTalent lang={lang} dict={{ contact, forms }} />
        </Suspense>
      </div>
      <Suspense fallback={<DirectContactSkeleton />}>
        <DirectContact lang={lang} />
      </Suspense>
    </main>
  );
}

/** The form, with the roster a Talent enquiry can pick from. */
async function ContactFormWithTalent({ lang, dict }: { lang: Locale; dict: ComponentProps<typeof ContactForm>["dict"] }) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: TALENT_OPTIONS_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  return <ContactForm lang={lang} dict={dict} talent={data} />;
}

async function DirectContact({ lang }: { lang: Locale }) {
  const { contact } = await getDictionary(lang);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: CONTACT_SETTINGS_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const settings = data;
  if (!settings?.contactEmail && !settings?.instagram) return null;

  return (
    <aside aria-labelledby="direct-contact" className="lg:pt-28">
      <h2 id="direct-contact" className="font-display text-2xl">
        {contact.directHeading}
      </h2>
      <dl className="mt-4 space-y-4">
        {settings.contactEmail && (
          <div>
            <dt className="text-sm text-fg-muted">{contact.emailLabel}</dt>
            <dd>
              <a href={`mailto:${settings.contactEmail}`} className="link-inline">
                {settings.contactEmail}
              </a>
            </dd>
          </div>
        )}
        {settings.instagram && (
          <div>
            <dt className="text-sm text-fg-muted">{contact.instagramLabel}</dt>
            <dd>
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 link-inline"
              >
                <BrandIcon icon={siInstagram} />
                {instagramHandle(settings.instagram)}
              </a>
            </dd>
          </div>
        )}
      </dl>
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
