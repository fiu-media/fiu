import { HomeHero } from "@/components/home/HomeHero";
import { GlassNav } from "@/components/nav/GlassNav";
import candle from "@/public/stills/candle.jpg";
import flowers from "@/public/stills/flowers.jpg";
import jackets from "@/public/stills/jackets.jpg";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

// Placeholder stills from the Canva pack until the CMS supplies them (Phase 2).
const stills = [candle, flowers, jackets];

export default function Home() {
  return (
    <main data-surface="cinematic" className="relative isolate h-dvh overflow-hidden bg-ink">
      <h1 className="sr-only">Fiú Media</h1>
      <HomeHero stills={stills} />
      <div className="relative z-10 flex justify-center p-4 md:absolute md:top-6 md:right-6 md:p-0">
        <GlassNav items={nav} onImage />
      </div>
    </main>
  );
}
