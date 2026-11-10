// No imports: the Studio config and the Node scripts (sync:dev) both read this, so it stays free of `sanity` and React.

type Flags = {
  /** One document per language (see sanity/studio/languages.ts). */
  translated?: true;
  /** A single document: can't be duplicated or deleted, and isn't offered in "new document" menus. */
  singleton?: true;
  /** Written by the site's server actions, not by editors: not offered in "new document" menus and never copied between datasets. */
  inbox?: true;
};

/** Every document type, with what the Studio and the tooling need to know about it. Keep in step with `schemaTypes` (checked by a test). */
export const documentTypes = {
  siteSettings: { translated: true, singleton: true },
  project: { translated: true },
  talent: { translated: true },
  projectType: { translated: true },
  role: { translated: true },
  rentalCategory: { translated: true },
  rentalItem: { translated: true },
  quoteRequest: { inbox: true },
  contactMessage: { inbox: true },
} as const satisfies Record<string, Flags>;

const withFlag = (flag: keyof Flags) =>
  Object.entries(documentTypes)
    .filter(([, flags]) => flag in flags)
    .map(([name]) => name);

export const translatedTypes = withFlag("translated");
export const singletonTypes = withFlag("singleton");
export const inboxTypes = withFlag("inbox");
