import type { StaticImageData } from "next/image";
import { z } from "zod";

import logoSvg from "@/public/brand/fiu-logo.svg";

/** What Next's image loader gives for an imported image (the fields `next/image` needs). */
const staticImage = z.object({ src: z.string(), width: z.number(), height: z.number() });

/** The Fiú wordmark. Next types every `.svg` import as `any`; this one goes through the image loader, so it is checked as one. */
export const logo: StaticImageData = staticImage.parse(logoSvg);
