import { fallbackStills } from "@/content/siteSettings";

import type { HeroStills } from "./mappers";

/** The hero before the CMS has stills of its own, and the first paint while they load. */
export const fallbackHeroStills: HeroStills = { landscape: fallbackStills, portrait: fallbackStills };
