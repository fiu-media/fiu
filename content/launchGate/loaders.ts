import { client } from "@/sanity/lib/client";

import { LAUNCH_AT_QUERY } from "./queries";

/** How long a read of the launch date is reused. A changed date reaches the live site within about this long. */
export const LAUNCH_AT_TTL_MS = 30_000;

type Read = { at: number; launchAt: Date | null };
let last: Read | null = null;

/** Parses the document's datetime. Anything missing or unreadable is "no date", which keeps the site closed. */
export function toLaunchAt(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * When the site opens to the public, or `null` if no date is published. Read by the proxy, which runs before
 * any render and so can't use the page cache: this reads the published document straight from the Sanity CDN
 * and keeps the answer for `LAUNCH_AT_TTL_MS`. If a read fails, the last answer is kept, so a site that has launched
 * doesn't close again during a Sanity outage.
 */
export async function getLaunchAt(now: number = Date.now()): Promise<Date | null> {
  if (last && now - last.at < LAUNCH_AT_TTL_MS) return last.launchAt;
  try {
    const value = await client.fetch(LAUNCH_AT_QUERY, {}, { cache: "no-store" });
    last = { at: now, launchAt: toLaunchAt(value) };
  } catch (error) {
    console.error("Could not read the launch date", error);
    // Back off for a TTL either way, so an outage isn't hit on every request.
    last = { at: now, launchAt: last?.launchAt ?? null };
  }
  return last.launchAt;
}

/** Forgets the remembered read. For tests. */
export function resetLaunchAtCache(): void {
  last = null;
}
