import type { Metadata } from "next";

import banquet from "../_options/stills/banquet.jpg";
import bouquet from "../_options/stills/bouquet.jpg";
import citrus from "../_options/stills/citrus.jpg";
import conservatory from "../_options/stills/conservatory.jpg";
import fur from "../_options/stills/fur.jpg";
import glow from "../_options/stills/glow.jpg";
import grapes from "../_options/stills/grapes.jpg";
import parlor from "../_options/stills/parlor.jpg";
import pond from "../_options/stills/pond.jpg";
import supper from "../_options/stills/supper.jpg";
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
