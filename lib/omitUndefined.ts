/** Narrows out `undefined`, including from a generic `T[K]`, which a plain `!== undefined` check can't express. */
const isDefined = <V>(value: V): value is Exclude<V, undefined> => value !== undefined;

/**
 * Drops keys whose value is `undefined`, for passing options to libraries whose optional props don't accept an
 * explicit `undefined` (`exactOptionalPropertyTypes`).
 */
export function omitUndefined<T extends object>(value: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const result: { [K in keyof T]?: Exclude<T[K], undefined> } = {};
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue;
    const entry = value[key];
    if (isDefined(entry)) result[key] = entry;
  }
  return result;
}

/**
 * `T` with every optional prop also accepting an explicit `undefined`. Lets a wrapper take what the caller has
 * (`priority={maybe}`) and forward it with `omitUndefined`, since library props are strict about it.
 */
export type AllowUndefined<T> = { [K in keyof T]: T[K] | undefined };
