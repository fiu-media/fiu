import { notFound } from "next/navigation";
import { railInset } from "@/components/nav/rail";
import { SiteNav } from "@/components/nav/SiteNav";
import { cn } from "@/lib/cn";
import { isLocale, localizedPath } from "@/lib/i18n/config";

/**
 * About, Our Work and Talent: they follow the system light/dark setting, with photography staying dark where it sits
 * under text. The rail sits beside the content. On phones the menu bar takes its own row, except over a page that opens
 * on a photo (About, a project), where it floats above it.
 */
export default async function CinematicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div data-surface="adaptive" className={cn("relative isolate min-h-dvh bg-bg text-fg", railInset)}>
      <SiteNav lang={lang} photoTopPaths={[localizedPath(lang, "/about"), `${localizedPath(lang, "/work")}/`]} />
      {children}
    </div>
  );
}
