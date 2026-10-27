import { HomeHero } from "@/components/home/HomeHero";
import { GlassNav } from "@/components/nav/GlassNav";
import banquet from "@/public/stills/banquet.jpg";
import bouquet from "@/public/stills/bouquet.jpg";
import citrus from "@/public/stills/citrus.jpg";
import conservatory from "@/public/stills/conservatory.jpg";
import fur from "@/public/stills/fur.jpg";
import glow from "@/public/stills/glow.jpg";
import grapes from "@/public/stills/grapes.jpg";
import parlor from "@/public/stills/parlor.jpg";
import pond from "@/public/stills/pond.jpg";
import supper from "@/public/stills/supper.jpg";

const nav = [
  { href: "/about", label: "About Us" },
  { href: "/work", label: "Our Work" },
  { href: "/talent", label: "Talent" },
  { href: "/rentals", label: "Rentals" },
  { href: "/contact", label: "Contact" },
];

// Hero stills (hi-res exports). lightTint: precomputed studio temperature for the glass.
const stills = [
  { ...conservatory, lightTint: "#a0957b" },
  { ...banquet, lightTint: "#866249" },
  { ...supper, lightTint: "#916d54" },
  { ...glow, lightTint: "#956444" },
  { ...citrus, lightTint: "#968a77" },
  { ...bouquet, lightTint: "#977980" },
  { ...grapes, lightTint: "#a39f82" },
  { ...pond, lightTint: "#746e67" },
  { ...fur, lightTint: "#8c5648" },
  { ...parlor, lightTint: "#716755" },
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
