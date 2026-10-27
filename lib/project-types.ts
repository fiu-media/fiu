/** The kinds of project Fiú makes. Stored as-is in the CMS; `?type=` uses the kebab-case form. */
export const projectTypes = ["Original", "Commercial", "Music Video", "Short", "Documentary"] as const;
export type ProjectType = (typeof projectTypes)[number];

export const typeToParam = (type: ProjectType) => type.toLowerCase().replace(/\s+/g, "-");

/** The project type for a `?type=` value, or null when it's missing or unknown. */
export const paramToType = (param: string | null | undefined): ProjectType | null =>
  projectTypes.find((type) => typeToParam(type) === param) ?? null;
