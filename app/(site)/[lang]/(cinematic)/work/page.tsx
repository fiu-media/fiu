import type { Metadata } from "next";
import { Suspense } from "react";

import { floatingBarInset, pageGutter, pageTop } from "@/components/layout/nav/rail";
import { FullBleedScroll } from "@/components/ui/FullBleedScroll";
import { GlassPillLink } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { FullScreenSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/content/project";
import { getSiteSettings } from "@/content/siteSettings";
import { getWorkIndex, getWorkMeta, SlideProgress } from "@/features/work";
import { cn } from "@/lib/cn";
import { getLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { href, pageMetadata, routes } from "@/lib/routes";

const SCROLL_ID = "work-scroll";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const lang = await getLocale(params);
  const { title, description } = await getWorkMeta(lang);
  return pageMetadata(lang, routes.work(), { title, description });
}

export default async function WorkPage({ params, searchParams }: PageProps<"/[lang]/work">) {
  const lang = await getLocale(params);
  const [{ work, common }, { workTagline, workIntro }] = await Promise.all([
    getDictionary(lang),
    getSiteSettings(lang, { draft: false }),
  ]);
  return (
    <main>
      {/* snap-start: the page snaps to its slides, and without this it would skip the title. */}
      {/* The gutter is inside the max-width box, as on the other pages, so the title lines up with theirs. */}
      <header className={cn("snap-start pb-10 md:pb-12", floatingBarInset, pageTop)}>
        <div className={cn("mx-auto max-w-6xl", pageGutter)}>
          <PageHeader title={work.title} tagline={workTagline} intro={workIntro} />
          <Suspense fallback={<FiltersSkeleton />}>
            <Filters lang={lang} searchParams={searchParams} />
          </Suspense>
        </div>
      </header>
      {/* ?type= and draft mode are dynamic, so the slides stream in behind a full-screen placeholder. */}
      <Suspense fallback={<FullScreenSkeleton label={common.loading} />}>
        <Projects lang={lang} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

type SearchParams = PageProps<"/[lang]/work">["searchParams"];

/** `?type=` once; a repeated one (an array) matches nothing, so it shows everything. */
const requestedType = (type: string | string[] | undefined) => (typeof type === "string" ? type : undefined);

async function Filters({ lang, searchParams }: { lang: Locale; searchParams: SearchParams }) {
  const [{ work }, { type }] = await Promise.all([getDictionary(lang), searchParams]);
  const { filters } = await getWorkIndex(lang, requestedType(type));
  if (filters.usable.length === 0) return null;
  const base = href(lang, routes.work());
  return (
    <nav aria-label={work.filterLabel} className="mt-8">
      {/* 12px between rows, so the 44px tap areas of wrapped pills meet without overlapping. */}
      <ul className="flex flex-wrap gap-x-2 gap-y-3">
        <li>
          <GlassPillLink href={base} size="sm" current={filters.active === null}>
            {work.all}
          </GlassPillLink>
        </li>
        {filters.usable.map((t) => (
          <li key={t.slug}>
            <GlassPillLink href={`${base}?type=${t.slug}`} size="sm" current={filters.active === t.slug}>
              {t.title}
            </GlassPillLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function Projects({ lang, searchParams }: { lang: Locale; searchParams: SearchParams }) {
  const [{ work, vimeo }, { type }] = await Promise.all([getDictionary(lang), searchParams]);
  const { filters, slides } = await getWorkIndex(lang, requestedType(type));

  if (slides.length === 0) {
    return (
      // Under the heading, in line with it, like the other pages' empty states.
      <p className={cn("mx-auto max-w-6xl pb-32 text-fg-muted", pageGutter)}>{work.emptyAll}</p>
    );
  }

  return (
    <>
      <SlideProgress
        key={`progress-${filters.active ?? "all"}`}
        containerId={SCROLL_ID}
        titles={slides.map((slide) => slide.title)}
        label={work.progressLabel}
        goTo={work.goTo}
      />

      <FullBleedScroll key={`scroll-${filters.active ?? "all"}`} id={SCROLL_ID} label={work.title}>
        {slides.map(({ id, ...slide }, i) => (
          <ProjectSlide
            key={id}
            {...slide}
            label={format(work.slideLabel, { title: slide.title, index: i + 1, total: slides.length })}
            priority={i === 0}
            dict={{ ...vimeo, view: work.view }}
          />
        ))}
      </FullBleedScroll>
    </>
  );
}

/** Same footprint as the filter pills, so they don't push the page down when they arrive. */
function FiltersSkeleton() {
  return (
    <div aria-hidden className="mt-8 flex flex-wrap gap-2">
      {["w-14", "w-24", "w-20", "w-28"].map((width, i) => (
        <Skeleton key={i} className={cn("h-8 rounded-full", width)} />
      ))}
    </div>
  );
}
