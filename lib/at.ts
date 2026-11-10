/**
 * Read `list[index]` where the index is known to be in range (grid maths, paired arrays).
 * With `noUncheckedIndexedAccess` a plain read is `T | undefined`; this narrows it and
 * fails loudly instead of letting a bad index turn into `NaN` further down.
 */
export function at<T>(list: ArrayLike<T>, index: number): T {
  const value = list[index];
  if (value === undefined) throw new RangeError(`Index ${index} is out of range (length ${list.length})`);
  return value;
}
