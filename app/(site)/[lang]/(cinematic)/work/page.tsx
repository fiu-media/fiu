import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FullBleedScroll } from "@/components/ui/FullBleedScroll";
import { GlassPillLink } from "@/components/ui/Glass";
import { PageTitle } from "@/components/ui/PageTitle";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/components/work/ProjectSlide";
import { SlideProgress } from "@/components/work/SlideProgress";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { getPageText } from "@/sanity/lib/pageText";
import { projectAttribute } from "@/sanity/lib/projects";
import { WORK_QUERY } from "@/sanity/lib/queries";
import { toSizedImage } from "@/sanity/lib/rentals";

const SCROLL_ID = "work-scroll";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const [{ work }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return { title: work.title, description: text.workIntro ?? undefined, alternates: languageAlternates(lang, "/work") };
}

export default async function WorkPage({ params, searchParams }: PageProps<"/[lang]/work">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [{ work, common }, text] = await Promise.all([getDictionary(lang), getPageText(lang)]);
  return (
    <main>
      {/* snap-start: the page snaps to its slides, and without this it would skip the title. */}
      <header className="snap-start px-4 pt-24 pb-10 md:px-6 md:pt-16 md:pb-12">
        <div className="mx-auto max-w-6xl">
          <PageTitle title={work.title} tagline={text.workTagline} />
          {text.workIntro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{text.workIntro}</p>}
          <Suspense>
            <Filters lang={lang} searchParams={searchParams} />
          </Suspense>
        </div>
      </header>
      {/* ?type= and draft mode are dynamic, so the slides stream in behind a full-screen placeholder. */}
      <Suspense fallback={<WorkSkeleton label={common.loading} />}>
        <Projects lang={lang} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Both the filter pills and the slides read this; `cachedSanity` makes the second call free. */
async function getWork(lang: Locale, searchParams: PageProps<"/[lang]/work">["searchParams"]) {
  const [{ type: requested }, { perspective, variant }] = await Promise.all([searchParams, getDynamicFetchOptions()]);
  const { data } = await cachedSanity({
    query: WORK_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  const { types, projects } = data;

  // Only offer types that have projects; an unknown ?type= falls back to everything.
  const usable = types.filter((t) => projects.some((p) => p.typeSlug === t.slug));
  const active = usable.find((t) => t.slug === requested)?.slug ?? null;
  const visible = active ? projects.filter((p) => p.typeSlug === active) : projects;
  return { projects, usable, active, visible };
}

async function Filters({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: PageProps<"/[lang]/work">["searchParams"];
}) {
  const [{ work }, { usable, active }] = await Promise.all([getDictionary(lang), getWork(lang, searchParams)]);
  if (usable.length === 0) return null;
  const base = localizedPath(lang, "/work");
  return (
    <nav aria-label={work.filterLabel} className="mt-8">
      <ul className="flex flex-wrap gap-2">
        <li>
          <GlassPillLink href={base} size="sm" current={active === null}>
            {work.all}
          </GlassPillLink>
        </li>
        {usable.map((t) => (
          <li key={t.slug}>
            <GlassPillLink href={`${base}?type=${t.slug}`} size="sm" current={active === t.slug}>
              {t.title}
            </GlassPillLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function Projects({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: PageProps<"/[lang]/work">["searchParams"];
}) {
  const [{ work, vimeo }, { projects, active, visible }] = await Promise.all([
    getDictionary(lang),
    getWork(lang, searchParams),
  ]);

  if (projects.length === 0) {
    return (
      <div className="grid place-items-center px-6 py-24 text-center">
        <p className="text-fg-muted">{work.emptyAll}</p>
      </div>
    );
  }

  return (
    <>
      <SlideProgress
        key={`progress-${active ?? "all"}`}
        containerId={SCROLL_ID}
        titles={visible.map((p) => p.title)}
        label={work.progressLabel}
        goTo={work.goTo}
      />

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
