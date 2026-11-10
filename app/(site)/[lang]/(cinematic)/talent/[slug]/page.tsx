import { ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { Suspense } from "react";

import { floatingBarInset, pageGutter, pageTop } from "@/components/layout/nav/rail";
import { BackLink } from "@/components/ui/BackLink";
import { FullBleedScroll } from "@/components/ui/FullBleedScroll";
import { SizedImg } from "@/components/ui/SizedImg";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/content/project";
import { getProfileMeta, getTalentProfile } from "@/features/talent";
import { cn } from "@/lib/cn";
import { getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { href, pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/talent/[slug]">): Promise<Metadata> {
  const [lang, { slug }] = await Promise.all([getLocale(params), params]);
  const meta = await getProfileMeta(lang, slug);
  if (!meta) return {};
  return pageMetadata(lang, routes.person(slug), meta);
}

export default function TalentProfilePage({ params }: PageProps<"/[lang]/talent/[slug]">) {
  // Slugs are only known at runtime, so the profile streams in behind a Suspense boundary.
  return (
    <main>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}

async function Profile({ params }: Pick<PageProps<"/[lang]/talent/[slug]">, "params">) {
  const [lang, { slug }] = await Promise.all([getLocale(params), params]);
  const [{ talent, vimeo }, profile] = await Promise.all([getDictionary(lang), getTalentProfile(lang, slug)]);
  if (!profile) notFound();

  const { name, roles, portrait, bio, attrs, projects } = profile;
  const workLabel = format(talent.projectsOf, { name });

  return (
    <>
      {/* snap-start: the page snaps to its slides, and without this it would skip the bio. */}
      <section className={cn("snap-start pb-16 md:pb-12", pageGutter, floatingBarInset, pageTop)}>
        <div className="mx-auto mb-6 max-w-6xl">
          <BackLink href={href(lang, routes.talent())}>{talent.back}</BackLink>
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14 lg:min-h-[calc(100dvh-10rem)]">
          <div data-sanity={attrs.portrait}>
            {portrait ? (
              <SizedImg
                image={portrait}
                sizes="(min-width: 768px) 42vw, 100vw"
                priority
                className="aspect-[4/5] w-full rounded-3xl"
              />
            ) : (
              <div className="grid aspect-[4/5] w-full place-items-center rounded-3xl bg-bg-raised text-sm text-fg-muted">
                {talent.noPortrait}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-6">
            <header>
              {roles && <p className="eyebrow">{roles}</p>}
              <h1 data-sanity={attrs.name} className="mt-2 font-display text-5xl text-balance italic md:text-7xl">
                {name}
              </h1>
            </header>
            {bio && bio.length > 0 && (
              <div data-sanity={attrs.bio} className="max-w-prose space-y-4 text-lg leading-relaxed text-fg/90">
                <PortableText value={bio} />
              </div>
            )}
            {projects.length > 0 && (
              <a href="#work" className="inline-flex items-center gap-1.5 text-sm link-quiet">
                {workLabel}
                <ArrowDown aria-hidden className="size-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <FullBleedScroll id="work" label={workLabel}>
          {projects.map(({ id, ...project }, i) => (
            <ProjectSlide
              key={id}
              {...project}
              label={format(talent.slideLabel, { title: project.title, index: i + 1, total: projects.length })}
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
    <section aria-hidden className={cn("pb-16 md:pb-12", pageGutter, floatingBarInset, pageTop)}>
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
