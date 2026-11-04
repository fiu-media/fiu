import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { PortableText } from "next-sanity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pageGutter } from "@/components/nav/rail";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProjectSlide } from "@/components/work/ProjectSlide";
import { ProjectStills, type Still } from "@/components/work/ProjectStills";
import { cn } from "@/lib/cn";
import { defaultLocale, isLocale, languageAlternates, localizedPath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { cachedSanity, getDynamicFetchOptions } from "@/sanity/lib/live";
import { projectAttribute } from "@/sanity/lib/projects";
import { PROJECT_ORDER_QUERY, PROJECT_QUERY } from "@/sanity/lib/queries";
import { toSizedImage } from "@/sanity/lib/rentals";

async function getProject(lang: Locale, slug: string) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: PROJECT_QUERY,
    params: { lang, fallbackLang: defaultLocale, slug },
    perspective,
    variant,
    stega: false,
  });
  return data;
}

async function getOrder(lang: Locale) {
  const { perspective, variant } = await getDynamicFetchOptions();
  const { data } = await cachedSanity({
    query: PROJECT_ORDER_QUERY,
    params: { lang, fallbackLang: defaultLocale },
    perspective,
    variant,
    stega: false,
  });
  return data;
}

/** The text of a block-content field, for the page description. */
function plainText(blocks: { children?: { text?: string }[] }[] | null | undefined) {
  return (blocks ?? [])
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .filter(Boolean)
    .join(" ");
}

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const project = await getProject(lang, slug);
  if (!project) return {};
  const summary = [project.type, project.year, project.client].filter(Boolean).join(" · ");
  return {
    title: project.title,
    description: plainText(project.description) || summary || undefined,
    alternates: languageAlternates(lang, `/work/${slug}`),
  };
}

export default function ProjectPage({ params }: PageProps<"/[lang]/work/[slug]">) {
  // Slugs are only known at runtime, so the project streams in behind a Suspense boundary.
  return (
    <main>
      <Suspense fallback={<Skeleton className="h-dvh rounded-none" />}>
        {params.then((p) => (
          <Project lang={p.lang} slug={p.slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function Project({ lang, slug }: { lang: string; slug: string }) {
  if (!isLocale(lang)) notFound();
  const [{ work, vimeo }, project, order] = await Promise.all([getDictionary(lang), getProject(lang, slug), getOrder(lang)]);
  if (!project) notFound();

  const credits = (project.credits ?? []).filter((credit) => credit.name);
  const stills = toStills(project.stills);
  const stillsMobile = toStills(project.stillsMobile);
  const hasDescription = !!project.description && project.description.length > 0;

  // Wraps round to the first project; nothing to link to when this is the only one.
  const at = order.findIndex((p) => p.slug === slug);
  const next = order.length > 1 && at >= 0 ? order[(at + 1) % order.length] : null;

  return (
    <>
      <ProjectSlide
        as="h1"
        // Short of a full screen, so the page content shows beneath it: this is a page to scroll, not another slide.
        className="h-[78dvh]"
        label={project.title}
        title={project.title}
        titleAttribute={projectAttribute(project._id, "title")}
        meta={[project.type, project.year, project.client].filter(Boolean).join(" · ")}
        image={project.cover ? toSizedImage(project.cover, 2400) : null}
        mobileImage={project.coverMobile ? toSizedImage(project.coverMobile, 1440) : null}
        vimeoUrl={project.vimeoUrl}
        previewLoopUrl={project.previewLoopUrl}
        priority
        dict={vimeo}
      />

      <div className={cn("mx-auto max-w-6xl space-y-16 pt-10 pb-16 md:pt-12 md:pb-24", pageGutter)}>
        <Link href={localizedPath(lang, "/work")} className="inline-flex items-center gap-1.5 text-sm link-quiet">
          <ArrowLeft aria-hidden className="size-4" />
          {work.back}
        </Link>

        {(hasDescription || credits.length > 0) && (
          <div className="grid gap-12 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-16">
            {hasDescription && (
              <div
                data-sanity={projectAttribute(project._id, "description")}
                className="max-w-prose space-y-4 text-lg leading-relaxed text-fg/90"
              >
                <PortableText value={project.description!} />
              </div>
            )}
            {credits.length > 0 && (
              <section aria-labelledby="project-credits" className="md:col-start-2">
                <h2 id="project-credits" className="mb-3 font-display text-2xl">
                  {work.credits}
                </h2>
                <dl className="divide-y divide-line border-y border-line">
                  {credits.map((credit) => (
                    <div key={credit._key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2 text-sm">
                      <dt className="text-fg-muted">{credit.role}</dt>
                      <dd>
                        {credit.talentSlug ? (
                          <Link href={localizedPath(lang, `/talent/${credit.talentSlug}`)} className="link-quiet">
                            {credit.name}
                          </Link>
                        ) : (
                          credit.name
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        )}

        {(stills.length > 0 || stillsMobile.length > 0) && (
          <section aria-labelledby="project-stills">
            <h2 id="project-stills" className="mb-4 font-display text-2xl">
              {work.stills}
            </h2>
            <ProjectStills landscape={stills} portrait={stillsMobile} dict={work} />
          </section>
        )}

        {next && (
          <Link
            href={localizedPath(lang, `/work/${next.slug}`)}
            className="group flex items-end justify-between gap-6 border-t border-line pt-8"
          >
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

function toStills(stills: Parameters<typeof toSizedImage>[0][] | null | undefined): Still[] {
  return (stills ?? []).flatMap((still) => {
    const thumb = toSizedImage(still, 1000);
    const full = toSizedImage(still, 2400);
    return thumb && full ? { thumb, full } : [];
  });
}
