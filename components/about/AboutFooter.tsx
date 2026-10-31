import { connection } from "next/server";
import { Suspense } from "react";
import { format } from "@/lib/i18n/format";

/** "Fíu Media © 2026". The year needs the current time, which Cache Components only allows past a request boundary. */
export function AboutFooter({ copyright }: { copyright: string }) {
  return (
    <p className="text-sm text-white/60">
      <Suspense fallback={format(copyright, { year: "" }).trim()}>
        <Year copyright={copyright} />
      </Suspense>
    </p>
  );
}

async function Year({ copyright }: { copyright: string }) {
  await connection();
  return format(copyright, { year: new Date().getFullYear() });
}
