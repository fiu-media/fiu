import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FullBleedScroll } from "@/components/ui/FullBleedScroll";
import { GlassPillLink } from "@/components/ui/Glass";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/components/work/ProjectSlide";
import { SlideProgress } from "@/components/work/SlideProgress";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { projectAttribute, type WorkResult } from "@/sanity/lib/projects";
import { WORK_QUERY } from "@/sanity/lib/queries";
import { toSizedImage } from "@/sanity/lib/rentals";

const SCROLL_ID = "work-scroll";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { work } = await getDictionary(lang);
  return { title: work.title, alternates: languageAlternates(lang, "/work") };
}

export default async function WorkPage({ params, searchParams }: PageProps<"/[lang]/work">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const { work, common } = await getDictionary(lang);
  return (
    <main>
      <h1 className="sr-only">{work.title}</h1>
      {/* ?type= and draft mode are dynamic, so the slides stream in behind a full-screen placeholder. */}
      <Suspense fallback={<WorkSkeleton label={common.loading} />}>
        <Projects lang={lang} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Projects({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: PageProps<"/[lang]/work">["searchParams"];
}) {
  const [{ work, vimeo }, { type: requested }] = await Promise.all([getDictionary(lang), searchParams]);
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: WORK_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const { types, projects } = (data ?? { types: [], projects: [] }) as WorkResult;

  if (projects.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="text-fg-muted">{work.emptyAll}</p>
      </div>
    );
  }

  // Only offer types that have projects; an unknown ?type= falls back to everything.
  const usable = types.filter((t) => projects.some((p) => p.typeSlug === t.slug));
  const active = usable.find((t) => t.slug === requested)?.slug ?? null;
  const visible = active ? projects.filter((p) => p.typeSlug === active) : projects;
  const base = localizedPath(lang, "/work");

  return (
    <>
      <SlideProgress
        key={`progress-${active ?? "all"}`}
        containerId={SCROLL_ID}
        titles={visible.map((p) => p.title)}
        label={work.progressLabel}
        goTo={work.goTo}
      >
        {usable.length > 0 && (
          <nav aria-label={work.filterLabel}>
            <ul className="flex w-max gap-2">
              <li>
                <GlassPillLink href={base} size="sm" onImage current={active === null}>
                  {work.all}
                </GlassPillLink>
              </li>
              {usable.map((t) => (
                <li key={t.slug}>
                  <GlassPillLink href={`${base}?type=${t.slug}`} size="sm" onImage current={active === t.slug}>
                    {t.title}
                  </GlassPillLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </SlideProgress>

      <FullBleedScroll key={`scroll-${active ?? "all"}`} id={SCROLL_ID} label={work.title}>
        {visible.map((project, i) => (
          <ProjectSlide
            key={project._id}
            label={format(work.slideLabel, { title: project.title, index: i + 1, total: visible.length })}
            title={project.title}
            titleAttribute={projectAttribute(project._id, "title")}
            meta={[project.type, project.year, project.client].filter(Boolean).join(" · ")}
            image={project.cover ? toSizedImage(project.cover, 2400) : null}
            vimeoUrl={project.vimeoUrl}
            previewLoopUrl={project.previewLoopUrl}
            priority={i === 0}
            dict={vimeo}
          />
        ))}
      </FullBleedScroll>
    </>
  );
}

function WorkSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy className="h-dvh">
      <span className="sr-only">{label}</span>
      <Skeleton className="size-full rounded-none" />
    </div>
  );
}
