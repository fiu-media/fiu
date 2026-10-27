"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { GlassPillButton } from "@/components/ui/Glass";

/*
 * Only one pairing is shown at a time; the buttons in the header are the only way to
 * switch. The choice lives in the URL hash (#a, #b, #c), so a reload or a shared link
 * lands on the same pairing, without adding history entries or scrolling the page.
 */

const EVENT = "specimen-pairing";
const DEFAULT = "a";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function usePairing() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || DEFAULT,
    () => DEFAULT,
  );
}

function select(id: string) {
  history.replaceState(null, "", `#${id}`);
  window.dispatchEvent(new Event(EVENT));
  // Always start a newly chosen pairing from its top.
  window.scrollTo({ top: 0, behavior: "instant" });
}

export function PairingSwitcher({ pairings }: { pairings: { id: string; name: string }[] }) {
  const active = usePairing();
  return (
    <div role="group" aria-label="Type pairing" className="flex gap-1.5">
      {pairings.map((p) => (
        <GlassPillButton key={p.id} size="sm" aria-pressed={active === p.id} onClick={() => select(p.id)}>
          {p.id.toUpperCase()} · {p.name}
        </GlassPillButton>
      ))}
    </div>
  );
}

/** Server-rendered pairing content, shown only while its pairing is selected. */
export function PairingPanel({ id, children }: { id: string; children: ReactNode }) {
  const active = usePairing();
  return <div hidden={active !== id}>{children}</div>;
}
