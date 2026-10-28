import { notFound } from "next/navigation";
import { isLocale, localizedPath } from "@/lib/i18n/config";
import { BackToDev } from "./BackToDev";

export default async function DevLayout({ children, params }: LayoutProps<"/[lang]/dev">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <>
      {children}
      <BackToDev href={localizedPath(lang, "/dev")} />
    </>
  );
}
