import { locales } from "@/lib/i18n/config";

/** What the proxy does with a request: let it through, show the splash, or send the visitor to sign in. */
export type GateDecision = "open" | "splash" | "login";

/** `/dev` and anything under it, with or without a language prefix. `/devices` and `/about/dev` are ordinary pages. */
export function isDevPath(pathname: string): boolean {
  const segments = pathname.split("/");
  const first = segments[1] ?? "";
  const section = locales.some((locale) => locale === first) ? segments[2] : first;
  return section === "dev";
}

/** The gate is on in production unless `SITE_GATE` says otherwise, and off elsewhere unless it says `on`. */
export function gateEnabled(siteGate: "on" | "off" | undefined, vercelEnv: string | undefined): boolean {
  return siteGate ? siteGate === "on" : vercelEnv === "production";
}

type Request = {
  /** Whether the gate is on at all (production, or forced on). */
  enabled: boolean;
  /** When the site opens to the public; `null` if no date is published, which keeps it closed. */
  launchAt: Date | null;
  now: Date;
  /** A valid signed-in staff session. */
  hasSession: boolean;
  /** Draft mode is on, which only editors with the Sanity preview secret can arrange. */
  hasDraftCookie: boolean;
  pathname: string;
};

/**
 * `/dev` always needs a staff session, launched or not, and draft mode doesn't count. Everything else is open once
 * `launchAt` has passed; before that, to staff and to editors previewing from the Studio.
 */
export function decideGate({ enabled, launchAt, now, hasSession, hasDraftCookie, pathname }: Request): GateDecision {
  if (!enabled) return "open";
  const launched = launchAt !== null && now >= launchAt;
  if (isDevPath(pathname)) {
    if (hasSession) return "open";
    return launched ? "login" : "splash";
  }
  if (launched || hasSession || hasDraftCookie) return "open";
  return "splash";
}
