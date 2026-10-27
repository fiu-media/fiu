import type { Metadata } from "next";
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
import { LogoPlayground } from "./LogoPlayground";

// Unlisted tuning surface — same stills as the home hero.
export const metadata: Metadata = {
  title: "Logo playground",
  robots: { index: false, follow: false },
};

const stills = [
  { ...conservatory, lightTint: "#a0957b", label: "conservatory" },
  { ...banquet, lightTint: "#866249", label: "banquet" },
  { ...supper, lightTint: "#916d54", label: "supper" },
  { ...glow, lightTint: "#956444", label: "glow" },
  { ...citrus, lightTint: "#968a77", label: "citrus" },
  { ...bouquet, lightTint: "#977980", label: "bouquet" },
  { ...grapes, lightTint: "#a39f82", label: "grapes" },
  { ...pond, lightTint: "#746e67", label: "pond" },
  { ...fur, lightTint: "#8c5648", label: "fur" },
  { ...parlor, lightTint: "#716755", label: "parlor" },
];

export default function LogoPlaygroundPage() {
  return <LogoPlayground stills={stills} />;
}
