import type { Metadata } from "next";
import { PortableText } from "next-sanity";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AboutContacts } from "@/components/about/AboutContacts";
import { AboutFooter } from "@/components/about/AboutFooter";
import { AboutLayoutA } from "@/components/about/AboutLayouts";
import { Skeleton } from "@/components/ui/Skeleton";
import { fallbackStills } from "@/lib/fallback-stills";
import { defaultLocale, isLocale, languageAlternates, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { settingsAttribute } from "@/sanity/lib/about";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { ABOUT_QUERY } from "@/sanity/lib/queries";
import { publishedId, toSizedImage } from "@/sanity/lib/rentals";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { about } = await getDictionary(lang);
  return { title: about.title, alternates: languageAlternates(lang, "/about") };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { common } = await getDictionary(lang);
  // Draft mode makes the content dynamic, so it streams in behind a full-screen placeholder.
  return (
    <Suspense fallback={<AboutSkeleton label={common.loading} />}>
      <About lang={lang} />
    </Suspense>
  );
}

async function About({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: ABOUT_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const settings = data;

  const fallback = fallbackStills[0];
  const still = (settings.still ? toSizedImage(settings.still, 2400) : null) ?? {
    src: fallback.src,
    width: fallback.width,
    height: fallback.height,
    alt: fallback.alt,
    blurDataURL: fallback.blurDataURL,
  };
  const id = settings._id ? publishedId(settings._id) : null;

  return (
    <AboutLayoutA
      still={still}
      slogan={settings.slogan ?? dict.about.title}
      gloss={settings.sloganGloss ?? null}
      manifesto={settings.manifesto?.length ? <PortableText value={settings.manifesto} /> : null}
      contacts={
        <AboutContacts
          email={settings.contactEmail ?? null}
          instagram={settings.instagram ?? null}
          labels={{ email: dict.about.emailLabel, instagram: dict.about.instagramLabel }}
        />
      }
      footer={<AboutFooter copyright={dict.footer.copyright} />}
      attributes={
        id
          ? {
              still: settingsAttribute(id, "aboutStill"),
              slogan: settingsAttribute(id, "slogan"),
              manifesto: settingsAttribute(id, "manifesto"),
            }
          : undefined
      }
    />
  );
}

function AboutSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy className="h-dvh">
      <span className="sr-only">{label}</span>
      <Skeleton className="size-full rounded-none" />
    </div>
  );
}
