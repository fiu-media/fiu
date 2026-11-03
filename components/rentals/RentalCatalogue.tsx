"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { GlassPillButton } from "@/components/ui/Glass";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import type { RentalImage } from "@/sanity/lib/rentals";
import { AddToQuote } from "./AddToQuote";
import { RentalImageView } from "./RentalImageView";

export type CatalogueCard = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  summary: string | null;
  categoryId: string | null;
  image: RentalImage | null;
};

/** The "All" pill's value: Sanity ids can't contain `*`, so no category can claim it. */
const ALL = "*";

export function RentalCatalogue({
  lang,
  categories,
  items,
  dict,
}: {
  lang: Locale;
  categories: { id: string; title: string }[];
  items: CatalogueCard[];
  dict: Dictionary["rentals"];
}) {
  // Only offer categories that actually have kit in them.
  const usable = categories.filter((c) => items.some((i) => i.categoryId === c.id));
  // `push` so Back/Forward step through filters; an unknown ?category= falls back to everything.
  const [requested, setRequested] = useQueryState(
    "category",
    parseAsString.withOptions({ history: "push", clearOnDefault: true }),
  );
  const category = usable.find((c) => c.id === requested)?.id ?? null;
  const visible = category ? items.filter((i) => i.categoryId === category) : items;

  return (
    <div>
      {usable.length > 0 && (
        // One pill is always pressed: pressing the current one again would leave nothing chosen, so it is ignored.
        <ToggleGroup
          aria-label={dict.filterLabel}
          value={[category ?? ALL]}
          onValueChange={([next]) => next !== undefined && setRequested(next === ALL ? null : next)}
          className="mb-8 flex flex-wrap gap-2"
        >
          <Toggle value={ALL} render={<GlassPillButton size="sm" />}>
            {dict.allCategories}
          </Toggle>
          {usable.map((c) => (
            <Toggle key={c.id} value={c.id} render={<GlassPillButton size="sm" />}>
              {c.title}
            </Toggle>
          ))}
        </ToggleGroup>
      )}

      {items.length === 0 ? (
        <p className="text-fg-muted">{dict.emptyCatalogue}</p>
      ) : visible.length === 0 ? (
        <p className="text-fg-muted">{dict.empty}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <ItemCard lang={lang} item={item} dict={dict} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemCard({ lang, item, dict }: { lang: Locale; item: CatalogueCard; dict: Dictionary["rentals"] }) {
  const href = localizedPath(lang, `/rentals/${item.slug}`);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-bg-raised">
      <Link href={href} tabIndex={-1} aria-hidden className="block">
        <RentalImageView
          image={item.image}
          placeholder={dict.noImage}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[4/3] w-full"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          {item.brand && <p className="text-xs font-medium tracking-wide text-fg-muted uppercase">{item.brand}</p>}
          <h3 className="font-display text-2xl leading-tight">
            <Link href={href} className="hover:underline">
              {item.name}
            </Link>
          </h3>
        </div>
        {item.summary && <p className="text-sm text-fg-muted">{item.summary}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <AddToQuote itemId={item.id} itemName={item.name} dict={dict} size="sm" />
          <Link href={href} className="px-2 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
            {dict.viewDetails}
          </Link>
        </div>
      </div>
    </article>
  );
}
