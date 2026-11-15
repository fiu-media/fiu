import { notFound } from "next/navigation";

import { isLocale, localizedPath } from "@/lib/i18n/config";

import { BackToConcepts } from "./BackToConcepts";

// Height of the back bar. Full-viewport pages subtract it so they don't scroll.
export default async function ConceptsLayout({ children, params }: LayoutProps<"/[lang]/concepts">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <div className="[--concepts-bar:2.5rem]">
      <BackToConcepts href={localizedPath(lang, "/concepts")} />
      {children}
    </div>
  );
}
