import type { Viewport } from "next";

/** The page's ink, for the browser bars. Mirrors `--ink` in `app/(site)/globals.css`; change both together. */
export const INK = "#0c0b0d";

/** For pages that are always dark (Home, About, Our Work, Talent), so the browser bars are too. */
export const cinematicViewport: Viewport = { themeColor: INK };
