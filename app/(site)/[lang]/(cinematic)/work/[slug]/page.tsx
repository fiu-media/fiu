import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { Suspense } from "react";

import { BackLink } from "@/components/ui/BackLink";
import { DetailList } from "@/components/ui/DetailList";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide, ProjectStills } from "@/content/project";
import { getProject, getProjectMeta } from "@/features/work";
import { cn } from "@/lib/cn";
import { getLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageGutter } from "@/lib/rail";
import { href, pageMetadata, routes } from "@/lib/routes";

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const [lang, { slug }] = await Promise.all([getLocale(params), params]);
  const meta = await getProjectMeta(lang, slug);
  if (!meta) return {};
  return pageMetadata(lang, routes.project(slug), meta);
}

export default function ProjectPage({ params }: PageProps<"/[lang]/work/[slug]">) {
  // Slugs are only known at runtime, so the project streams in behind a Suspense boundary.
  return (
    <main>
      <Suspense fallback={<Skeleton className="h-dvh rounded-none" />}>
        <Project params={params} />
      </Suspense>
    </main>
  );
}

async function Project({ params }: Pick<PageProps<"/[lang]/work/[slug]">, "params">) {
  const [lang, { slug }] = await Promise.all([getLocale(params), params]);
  const [{ work, vimeo }, project] = await Promise.all([getDictionary(lang), getProject(lang, slug)]);
  if (!project) notFound();

  const { slide, description, descriptionAttribute, credits, stills, next } = project;
  const hasDescription = !!description && description.length > 0;
  const hasStills = stills.landscape.length > 0 || stills.portrait.length > 0;

  return (
    <>
      <ProjectSlide
        as="h1"
        // Short of a full screen, so the page content shows beneath it: this is a page to scroll, not another slide.
        className="h-[78dvh]"
        label={slide.title}
        {...slide}
        priority
        dict={vimeo}
      />

      <div className={cn("mx-auto max-w-6xl space-y-16 pt-10 pb-16 md:pt-12 md:pb-24", pageGutter)}>
        <BackLink href={href(lang, routes.work())}>{work.back}</BackLink>

        {(hasDescription || credits.length > 0 || hasStills) && (
          // One grid so credits can sit beside the description on wide screens and after the stills on narrow ones.
          <div className="grid gap-16 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {hasDescription && (
              <div data-sanity={descriptionAttribute} className="max-w-prose space-y-4 text-lg leading-relaxed text-fg/90">
                <PortableText value={description} />
              </div>
            )}
            {credits.length > 0 && (
              <section aria-labelledby="project-credits" className="max-md:order-last md:col-start-2">
                <h2 id="project-credits" className="mb-3 font-display text-2xl">
                  {work.credits}
                </h2>
                <DetailList
                  rows={credits.map((credit) => ({
                    key: credit.key,
                    term: credit.role,
                    detail: credit.href ? (
                      <Link href={credit.href} className="link-quiet">
                        {credit.name}
                      </Link>
                    ) : (
                      credit.name
                    ),
                  }))}
                />
              </section>
            )}
            {hasStills && (
              <section aria-labelledby="project-stills" className="md:col-span-full">
                <h2 id="project-stills" className="mb-4 font-display text-2xl">
                  {work.stills}
                </h2>
                <ProjectStills landscape={stills.landscape} portrait={stills.portrait} dict={work} />
              </section>
            )}
          </div>
        )}

        {next && (
          <Link href={next.href} className="group flex items-end justify-between gap-6 border-t border-line pt-8">
            <span>
              <span className="eyebrow">{work.next}</span>
              <span className="mt-1 block font-display text-3xl italic md:text-5xl">{next.title}</span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-6 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            />
          </Link>
        )}
      </div>
    </>
  );
}
