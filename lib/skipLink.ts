/** Where "Skip to content" lands. Spread onto each page's `<main>`: the id is the link's target, and `tabIndex` lets it take focus. */
export const skipTarget = { id: "main", tabIndex: -1 } as const;

/** The skip link's `href`. */
export const skipHref = `#${skipTarget.id}`;
