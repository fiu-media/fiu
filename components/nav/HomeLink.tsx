import Link from "next/link";
import logo from "@/public/brand/fiu-logo.svg";

/** The logo as a mask, so it takes the surrounding text colour. Size it with a height class. */
export function LogoMask({ className = "h-9 md:h-11" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block bg-current ${className}`}
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
  );
}

/** The small logo that returns to Home. The SVG is white, so it is used as a mask and takes the text colour. */
export function HomeLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} aria-label={label} className="block shrink-0 rounded-md text-fg">
      <LogoMask className={className} />
    </Link>
  );
}
