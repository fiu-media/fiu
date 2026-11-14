import type { Metadata } from "next";

import { LaunchSplash } from "@/features/gate";
import { cinematicViewport } from "@/lib/theme";

// The proxy shows this in place of every page until the launch date. It must never be indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const viewport = cinematicViewport;

export default function LaunchingPage() {
  return <LaunchSplash />;
}
