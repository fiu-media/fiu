import type { ReactNode } from "react";

/** A titled block of running text. */
export function PolicySection({ heading, children }: { heading: string; children: ReactNode }) {
  const id = slug(heading);
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-2xl">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-fg-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** A heading as an id: "Who handles it for us" → "who-handles-it-for-us". */
const slug = (heading: string) =>
  `privacy-${heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")}`;
