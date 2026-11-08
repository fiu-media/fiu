import { type Locale, locales } from "./config";

/**
 * The first supported locale a browser asks for, from an `Accept-Language` header, or null when it
 * names none (no header, or only languages we don't serve). Entries rank by `q` then by position, so
 * `en-IE,en;q=0.9,ga;q=0.8` prefers English and `ga,en;q=0.5` prefers Irish.
 */
export function preferredLocale(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((entry, position) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const q = params.map((param) => /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(param)?.[1]).find(Boolean);
      return { language: tag.trim().toLowerCase().split("-")[0] ?? "", q: q === undefined ? 1 : Number(q), position };
    })
    .filter(({ language, q }) => language && language !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.position - b.position);
  return ranked.map(({ language }) => locales.find((l) => l === language)).find((l) => l !== undefined) ?? null;
}
