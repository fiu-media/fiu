import { NotFoundPage } from "@/components/NotFoundPage";
import { defaultLocale } from "@/lib/i18n/config";

// not-found.tsx gets no params, so this renders in the default locale (the only one so far).
// Compare the other layouts at /dev/not-found.
export default function NotFound() {
  return <NotFoundPage lang={defaultLocale} />;
}
