import { features } from "@/lib/features";
import { locales } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";

/** Pages that host a form. Server Actions POST to the URL of the page they sit on. */
const formPages: string[] = [routes.contact(), ...(features.rentals ? [routes.quote()] : [])];

/**
 * What BotID must challenge on the client: each form page in every locale (`/contact`, `/ga/contact`, ...).
 * A path missing here gets no challenge, so `checkBotId()` would reject real visitors on it. Kept apart
 * from `instrumentation-client.ts` because that file runs `initBotId` on import.
 */
export const botIdProtectedPaths = formPages.flatMap((page) =>
  locales.map((lang) => ({ path: href(lang, page), method: "POST" })),
);
