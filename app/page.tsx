import { HomeHero } from "@/components/home/HomeHero";
import { GlassNav } from "@/components/nav/GlassNav";
import bouquet from "@/public/stills/bouquet.jpg";
import citrus from "@/public/stills/citrus.jpg";
import conservatory from "@/public/stills/conservatory.jpg";
import fur from "@/public/stills/fur.jpg";
import glow from "@/public/stills/glow.jpg";
import grapes from "@/public/stills/grapes.jpg";
import parlor from "@/public/stills/parlor.jpg";
import pond from "@/public/stills/pond.jpg";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

// Placeholder stills from the Canva pack until the CMS supplies them (Phase 2).
// lightTint: precomputed studio temperature (CMS will ship this; avoids CORS sampling).
const stills = [
  { ...conservatory, lightTint: "#837b51" },
  { ...glow, lightTint: "#924c16" },
  { ...citrus, lightTint: "#71755e" },
  { ...bouquet, lightTint: "#8e6b68" },
  { ...grapes, lightTint: "#76774f" },
  { ...pond, lightTint: "#606547" },
  { ...fur, lightTint: "#903a1f" },
  { ...parlor, lightTint: "#6a522c" },
];

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
