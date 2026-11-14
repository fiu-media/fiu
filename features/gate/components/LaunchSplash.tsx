import Image from "next/image";

import { logo } from "@/lib/brand";

/** What the public sees before launch: the logo, centred, and nothing else. */
export function LaunchSplash() {
  return (
    <main data-surface="cinematic" className="grid min-h-dvh place-items-center bg-ink px-6 text-fg">
      <Image src={logo} alt="Fiú Media" priority className="h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-[720px]" />
    </main>
  );
}
