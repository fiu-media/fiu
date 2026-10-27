import Link from "next/link";
import logo from "@/public/brand/fiu-logo.svg";

/** The small logo that returns to Home. The SVG is white, so it is used as a mask and takes the text colour. */
export function HomeLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="block rounded-md text-fg">
      <span
        aria-hidden
        className="block h-9 bg-current md:h-11"
        style={{
          aspectRatio: "763.5 / 653.75",
          maskImage: `url(${logo.src})`,
          WebkitMaskImage: `url(${logo.src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    </Link>
  );
}
