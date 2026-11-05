"use client";

import { useEffect, useState } from "react";
import { GlassPillButton } from "@/components/ui/Glass";

const options = ["system", "light", "dark"] as const;
type Scheme = (typeof options)[number];

/** Review aid: pins the adaptive surfaces to light or dark without changing OS settings. */
export function SchemeSwitcher() {
  const [scheme, setScheme] = useState<Scheme>("system");

  useEffect(() => {
    const root = document.documentElement;
    if (scheme === "system") root.removeAttribute("data-force-scheme");
    else root.setAttribute("data-force-scheme", scheme);
    return () => root.removeAttribute("data-force-scheme");
  }, [scheme]);

  return (
    <div role="group" aria-label="Colour scheme" className="flex gap-1.5">
      {options.map((option) => (
        <GlassPillButton key={option} size="sm" aria-pressed={scheme === option} onClick={() => setScheme(option)}>
          {option[0].toUpperCase() + option.slice(1)}
        </GlassPillButton>
      ))}
    </div>
  );
}
