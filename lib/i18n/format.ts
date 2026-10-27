/** Fill `{name}` placeholders in dictionary strings. Strings, not functions, so slices can cross into Client Components. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
