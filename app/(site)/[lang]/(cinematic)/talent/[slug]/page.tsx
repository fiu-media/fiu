import type { Metadata } from "next";
import { PortableText } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FullBleedScroll } from "@/components/ui/FullBleedScroll";
import { GlassPillLink } from "@/components/ui/Glass";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/components/work/ProjectSlide";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { TALENT_PROFILE_QUERY, TALENT_PROJECTS_QUERY } from "@/sanity/lib/queries";
import { publishedId, toSizedImage } from "@/sanity/lib/rentals";
import { talentAttribute } from "@/sanity/lib/talent";

async function getProfile(lang: Locale, slug: string) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: TALENT_PROFILE_QUERY,
    params: { lang, fallbackLang: defaultLocale, slug },
    perspective,
    variant,
    stega: false,
  });
  return data;
}

async function getProjects(lang: Locale, talentId: string) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: TALENT_PROJECTS_QUERY,
    params: { lang, fallbackLang: defaultLocale, talentId: publishedId(talentId) },
    perspective,
    variant,
    stega: false,
  });
  return data;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/talent/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const profile = await getProfile(lang, slug);
  if (!profile) return {};
  return {
    title: profile.name,
    description: (profile.roles ?? []).join(", ") || undefined,
    alternates: languageAlternates(lang, `/talent/${slug}`),
  };
}

export default function TalentProfilePage({ params }: PageProps<"/[lang]/talent/[slug]">) {
  // Slugs are only known at runtime, so the profile streams in behind a Suspense boundary.
  return (
    <main>
      <Suspense fallback={<ProfileSkeleton />}>
        {params.then((p) => (
          <Profile lang={p.lang} slug={p.slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function Profile({ lang, slug }: { lang: string; slug: string }) {
  if (!isLocale(lang)) notFound();
  const [{ talent, vimeo }, profile] = await Promise.all([getDictionary(lang), getProfile(lang, slug)]);
  if (!profile) notFound();
  const projects = await getProjects(lang, profile.talentId);

  const portrait = profile.portrait ? toSizedImage(profile.portrait, 1200) : null;
  const roles = (profile.roles ?? []).join(", ");
  const contactHref = `${localizedPath(lang, "/contact")}?type=Talent`;
  const workLabel = format(talent.projectsOf, { name: profile.name });

  return (
    <>
      {/* snap-start: the page snaps to its slides, and without this it would skip the bio. */}
      <section className="snap-start px-4 pt-24 pb-16 md:px-6 md:pt-16 md:pb-12">
        <div className="mx-auto mb-6 max-w-6xl">
          <Link
            href={localizedPath(lang, "/talent")}
            className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            ← {talent.back}
          </Link>
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14 lg:min-h-[calc(100dvh-10rem)]">
          <div data-sanity={talentAttribute(profile._id, "portrait")}>
            {portrait ? (
              <Image
                src={portrait.src}
                width={portrait.width}
                height={portrait.height}
                alt={portrait.alt}
                sizes="(min-width: 768px) 42vw, 100vw"
                priority
                placeholder={portrait.blurDataURL ? "blur" : "empty"}
                blurDataURL={portrait.blurDataURL}
                style={{ objectPosition: portrait.position }}
                className="aspect-[4/5] w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="grid aspect-[4/5] w-full place-items-center rounded-3xl bg-bg-raised text-sm text-fg-muted">
                {talent.noPortrait}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-6">
            <header>
              {roles && <p className="text-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{roles}</p>}
              <h1
                data-sanity={talentAttribute(profile._id, "name")}
                className="mt-2 font-display text-5xl text-balance md:text-7xl"
              >
                {profile.name}
              </h1>
            </header>
            {profile.bio && profile.bio.length > 0 && (
              <div
                data-sanity={talentAttribute(profile._id, "bio")}
                className="max-w-prose space-y-4 text-lg leading-relaxed text-fg/90"
              >
                <PortableText value={profile.bio} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <GlassPillLink href={contactHref} size="lg">
                {format(talent.workWith, { name: profile.name })}
              </GlassPillLink>
              {projects.length > 0 && (
                <a href="#work" className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                  {workLabel} ↓
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <FullBleedScroll id="work" label={workLabel}>
          {projects.map((project, i) => (
            <ProjectSlide
              key={project._id}
              label={format(talent.slideLabel, { title: project.title, index: i + 1, total: projects.length })}
              title={project.title}
              meta={[project.type, project.year, project.client].filter(Boolean).join(" · ")}
              role={(project.roles ?? []).join(", ") || undefined}
              image={project.cover ? toSizedImage(project.cover, 2400) : null}
              vimeoUrl={project.vimeoUrl}
              previewLoopUrl={project.previewLoopUrl}
              dict={vimeo}
            />
          ))}
        </FullBleedScroll>
      )}
    </>
  );
}

/** Same footprint as the profile's first screen: back link, portrait beside the name, bio and button. */
function ProfileSkeleton() {
  return (
    <section aria-hidden className="px-4 pt-24 pb-16 md:px-6 md:pt-16 md:pb-12">
      <div className="mx-auto mb-6 max-w-6xl">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14 lg:min-h-[calc(100dvh-10rem)]">
        <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
        <div className="flex flex-col items-start gap-6">
          <div className="w-full space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 w-3/4 md:h-20" />
          </div>
          <div className="w-full max-w-prose space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Skeleton className="h-12 w-56 rounded-full" />
        </div>
      </div>
    </section>
  );
}
