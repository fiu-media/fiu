import type { StaticImageData } from "next/image";

import logoSvg from "@/public/brand/fiu-logo.svg";

/** The Fiú wordmark. Next types every `.svg` import as `any`, but this one goes through the image loader, so it is a `StaticImageData`. */
export const logo = logoSvg as StaticImageData;
