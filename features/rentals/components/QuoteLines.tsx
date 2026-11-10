"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { useQuoteBasket } from "@/features/rentals/basket/store";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import { omitUndefined } from "@/lib/omitUndefined";

import { itemMax, useCatalogue } from "../basket/CatalogueContext";
import { QuantityField } from "./QuantityField";
import { RentalImageView } from "./RentalImageView";

/** Basket lines with quantity fields; shared by the drawer and the quote form. */
export function QuoteLines({ dict, onNavigate }: { dict: Dictionary["basket"]; onNavigate?: () => void }) {
  const { lines, setQty, remove } = useQuoteBasket();
  const catalogue = useCatalogue();

  // An item's cap can be lowered after it went into someone's basket.
  useEffect(() => {
    for (const { itemId, qty } of lines) {
      const max = catalogue[itemId]?.max;
      if (max !== undefined && qty > max) setQty(itemId, max, max);
    }
  }, [lines, catalogue, setQty]);

  return (
    <ul className="divide-y divide-line">
      {lines.map(({ itemId, qty }) => {
        const item = catalogue[itemId];
        const name = item?.name ?? dict.unknownItem;
        const max = itemMax(catalogue, itemId);
        return (
          <li key={itemId} className="flex items-center gap-3 py-3">
            <RentalImageView image={item?.image ?? null} placeholder="" sizes="56px" className="size-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              {item ? (
                <Link
                  href={item.href}
                  {...omitUndefined({ onClick: onNavigate })}
                  className="block truncate font-medium underline-offset-4 hover:underline"
                >
                  {name}
                </Link>
              ) : (
                <p className="truncate font-medium text-fg-muted">{name}</p>
              )}
              {item?.brand && <p className="truncate text-xs text-fg-muted">{item.brand}</p>}
            </div>
            <QuantityField
              value={qty}
              max={max}
              onChange={(next) => setQty(itemId, next, max)}
              label={format(dict.quantityOf, { name })}
              decreaseLabel={format(dict.decrease, { name })}
              increaseLabel={format(dict.increase, { name })}
            />
            <button
              type="button"
              onClick={() => remove(itemId)}
              aria-label={format(dict.remove, { name })}
              className="grid size-8 cursor-pointer place-items-center rounded-full text-fg-muted hover:bg-line hover:text-fg"
            >
              <X aria-hidden className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
