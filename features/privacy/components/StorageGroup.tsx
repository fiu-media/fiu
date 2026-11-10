type StorageEntry = { name: string; type: string; lasts: string; description: string };

/** What a site stores in the browser, one entry per cookie or key: its name as code, then what it is for. */
export function StorageGroup({ title, items }: { title: string; items: readonly StorageEntry[] }) {
  return (
    <div className="pt-2">
      <h3 className="font-medium text-fg">{title}</h3>
      <dl className="mt-3 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <div key={item.name} className="py-4">
            <dt className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <code className="rounded-md bg-bg-raised px-2 py-0.5 font-mono text-sm text-fg">{item.name}</code>
              <span className="text-sm text-fg-muted">
                {item.type} · {item.lasts}
              </span>
            </dt>
            <dd className="mt-2">{item.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
