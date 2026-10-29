import { notFound } from "next/navigation";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { BackToDev } from "./BackToDev";

// Height of the back bar. Full-viewport pages subtract it so they don't scroll.
export default async function DevLayout({ children, params }: LayoutProps<"/[lang]/dev">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <div className="[--dev-bar:2.5rem]">
      <BackToDev href={localizedPath(lang, "/dev")} />
      {children}
    </div>
  );
}
