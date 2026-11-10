/**
 * Drops keys whose value is `undefined`, for passing options to libraries whose optional props don't accept an
 * explicit `undefined` (`exactOptionalPropertyTypes`). The cast is the one place TypeScript can't follow the filter.
 */
export function omitUndefined<T extends object>(value: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

/**
 * `T` with every optional prop also accepting an explicit `undefined`. Lets a wrapper take what the caller has
 * (`priority={maybe}`) and forward it with `omitUndefined`, since library props are strict about it.
 */
export type AllowUndefined<T> = { [K in keyof T]: T[K] | undefined };
