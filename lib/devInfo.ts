/**
 * A diagnostic line for the developer, printed with `console.info` outside production and dropped in it. Production code
 * otherwise logs only through warn/error (see `no-console` in eslint.config.mjs, which exempts this file).
 */
export function devInfo(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(message);
}
