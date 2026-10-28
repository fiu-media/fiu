"use client";

import { useMemo } from "react";
import {
  DIFF_GROUP_LABELS,
  DIFF_GROUP_ORDER,
  type ConfigDiff,
  type DiffEntry,
  type DiffGroup,
  type DiffValue,
} from "@/components/three/logoDiff";

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(4)));
}

function formatValue(value: DiffValue): string {
  if (value === null) return "—";
  if (typeof value === "number") return formatNumber(value);
  return String(value);
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? "+" : "−"}${formatNumber(Math.abs(delta))}`;
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  if (entry.kind !== "changed") {
    const added = entry.kind === "added";
    return (
      <li className="flex items-baseline justify-between gap-3 py-1 text-xs">
        <span className="text-white/80">{entry.label}</span>
        <span className={added ? "text-emerald-300" : "text-rose-300"}>{added ? "added" : "removed"}</span>
      </li>
    );
  }
  return (
    <li className="py-1 text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-white/80">{entry.label}</span>
        {entry.delta !== null && (
          <span className="text-[10px] tabular-nums text-white/45">{formatDelta(entry.delta)}</span>
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono text-[11px] tabular-nums">
        <span className="rounded bg-rose-400/15 px-1 text-rose-200 line-through decoration-rose-300/50">
          {formatValue(entry.before)}
        </span>
        <span className="text-white/35" aria-hidden>
          →
        </span>
        <span className="rounded bg-emerald-400/15 px-1 text-emerald-200">{formatValue(entry.after)}</span>
      </div>
    </li>
  );
}

/** Lights group under their label; everything else is a flat list. */
function GroupBody({ entries }: { entries: DiffEntry[] }) {
  const bySubject = useMemo(() => {
    const map = new Map<string | null, DiffEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.subject);
      if (list) list.push(entry);
      else map.set(entry.subject, [entry]);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-1.5">
      {[...bySubject].map(([subject, rows]) =>
        subject === null ? (
          <ul key="flat" className="divide-y divide-white/5">
            {rows.map((entry) => (
              <DiffRow key={entry.path} entry={entry} />
            ))}
          </ul>
        ) : (
          <details key={subject} open className="rounded-xl border border-white/10 bg-white/5">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-xs text-white/85">
              <span>{subject}</span>
              <span className="text-[10px] tabular-nums text-white/45">{rows.length}</span>
            </summary>
            <ul className="divide-y divide-white/5 px-3 pb-1.5">
              {rows.map((entry) => (
                <DiffRow key={entry.path} entry={entry} />
              ))}
            </ul>
          </details>
        ),
      )}
    </div>
  );
}

export function LogoDiffView({ diff, emptyText }: { diff: ConfigDiff; emptyText: string }) {
  const groups = useMemo(() => {
    const map = new Map<DiffGroup, DiffEntry[]>();
    for (const entry of diff.entries) {
      const list = map.get(entry.group);
      if (list) list.push(entry);
      else map.set(entry.group, [entry]);
    }
    return DIFF_GROUP_ORDER.flatMap((group) => {
      const rows = map.get(group);
      return rows ? [{ group, rows }] : [];
    });
  }, [diff.entries]);

  const changes = diff.entries.length;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-white/55">
        <span className={changes ? "font-medium text-white/90" : undefined}>
          {changes} {changes === 1 ? "change" : "changes"}
        </span>{" "}
        · {diff.unchanged} unchanged
      </p>
      {changes === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white/55">{emptyText}</p>
      ) : (
        groups.map(({ group, rows }) => (
          <section key={group}>
            <h3 className="mb-1 flex items-center justify-between text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
              <span>{DIFF_GROUP_LABELS[group]}</span>
              <span className="tabular-nums">{rows.length}</span>
            </h3>
            <GroupBody entries={rows} />
          </section>
        ))
      )}
    </div>
  );
}
