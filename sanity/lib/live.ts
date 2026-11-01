import { cookies, draftMode } from "next/headers";
import {
  defineLive,
  resolvePerspectiveFromCookies,
  resolveVariantFromCookies,
  type LivePerspective,
  type StrictDefinedFetchType,
} from "next-sanity/live";
import { makeSafeQueryRunner } from "groqd";
import { client } from "./client";

const token = process.env.SANITY_API_READ_TOKEN;

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
  strict: true,
});

/**
 * The app's one shared 'use cache' boundary. `sanityFetch` tags and sets the cache life
 * itself but doesn't create the boundary, so this wrapper provides it once.
 */
export const cachedSanity: StrictDefinedFetchType = async (options) => {
  "use cache";
  return sanityFetch(options);
};

export interface DynamicFetchOptions {
  perspective: LivePerspective;
  variant?: string;
  stega: boolean;
}

/**
 * Runs a groqd query through `cachedSanity`, then validates the response against the query's validators.
 * Parsing happens outside the cache boundary, so what gets cached is the plain response.
 *
 *   fetchQuery(RENTALS_QUERY, { parameters: { lang, fallbackLang }, perspective: "published", stega: false })
 */
export const fetchQuery = makeSafeQueryRunner<DynamicFetchOptions>(async (query, { parameters, perspective, variant, stega }) => {
  const { data } = await cachedSanity({ query, params: parameters, perspective, variant, stega });
  return data;
});

/** Resolve draft-mode state outside 'use cache' boundaries, then pass it into cached components. */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return { perspective: "published", stega: false };

  const jar = await cookies();
  const perspective = await resolvePerspectiveFromCookies({ cookies: jar });
  const variant = await resolveVariantFromCookies({ cookies: jar });
  return { perspective: perspective ?? "drafts", variant, stega: true };
}
