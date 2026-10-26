import Image from "next/image";
import { GlassNav } from "@/components/nav/GlassNav";
import { FiuLogo } from "@/components/three/FiuLogo";
import still from "@/public/stills/candle.jpg";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

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
        <FiuLogo backdropSrc={still.src} />
      </h1>
    </main>
  );
}
