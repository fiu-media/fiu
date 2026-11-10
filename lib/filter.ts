/**
 * Narrows `items` by a requested group (a URL value like `?type=` or `?category=`).
 * Only groups that have items are offered, and an unknown or missing request falls back to showing everything.
 */
export function selectFilter<Group, Item>(
  groups: readonly Group[],
  items: readonly Item[],
  requested: string | null | undefined,
  { idOf, groupOf }: { idOf: (group: Group) => string; groupOf: (item: Item) => string | null | undefined },
) {
  const usable = groups.filter((group) => items.some((item) => groupOf(item) === idOf(group)));
  const active = usable.map(idOf).find((id) => id === requested) ?? null;
  const visible = active ? items.filter((item) => groupOf(item) === active) : [...items];
  return { usable, active, visible };
}
