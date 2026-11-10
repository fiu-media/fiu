import type { ReactNode } from "react";

/** A two-column list of terms and details: rental specs, project credits. */
export function DetailList({ rows }: { rows: { key: string; term: ReactNode; detail: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map(({ key, term, detail }) => (
        <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2 text-sm">
          <dt className="text-fg-muted">{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
