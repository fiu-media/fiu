import Image from "next/image";
import { GlassNav } from "@/components/nav/GlassNav";
import logo from "@/public/brand/fiu-logo.png";
import still from "@/public/stills/candle.jpg";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

// Phase 1 placeholder following Home mockup 1. Phase 3 replaces it with CMS stills and the live WebGL logo.
export default function Home() {
  return (
    <main data-surface="cinematic" className="relative isolate h-dvh overflow-hidden bg-ink">
      <Image
        src={still}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="relative z-10 flex justify-center p-4 md:absolute md:top-6 md:right-6 md:p-0">
        <GlassNav items={nav} onImage />
      </div>
      <h1 className="pointer-events-none absolute inset-0 grid place-items-center md:justify-start md:pl-[4vw]">
        <Image
          src={logo}
          alt="Fíu"
          priority
          sizes="(min-width: 768px) 42vw, 80vw"
          className="h-auto w-[80vw] max-w-[640px] md:w-[42vw]"
        />
      </h1>
    </main>
  );
}
