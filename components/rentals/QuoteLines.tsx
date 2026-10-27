"use client";

import Link from "next/link";
import { useEffect } from "react";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useQuoteBasket } from "@/lib/quote-basket";
import { useCatalogue } from "./CatalogueContext";
import { RentalImageView } from "./RentalImageView";

/** Basket lines with quantity steppers; shared by the drawer and the quote form. */
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
        const max = item?.max ?? 99;
        return (
          <li key={itemId} className="flex items-center gap-3 py-3">
            <RentalImageView
              image={item?.image ?? null}
              placeholder=""
              sizes="56px"
              className="size-14 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              {item ? (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="block truncate font-medium underline-offset-4 hover:underline"
                >
                  {name}
                </Link>
              ) : (
                <p className="truncate font-medium text-fg-muted">{name}</p>
              )}
              {item?.brand && <p className="truncate text-xs text-fg-muted">{item.brand}</p>}
            </div>
            <div role="group" aria-label={format(dict.quantityOf, { name })} className="flex items-center gap-1">
              <StepButton label={format(dict.decrease, { name })} onClick={() => setQty(itemId, qty - 1, max)}>
                −
              </StepButton>
              <output aria-live="polite" className="w-7 text-center text-sm tabular-nums">
                {qty}
              </output>
              <StepButton label={format(dict.increase, { name })} disabled={qty >= max} onClick={() => setQty(itemId, qty + 1, max)}>
                +
              </StepButton>
            </div>
            <button
              type="button"
              onClick={() => remove(itemId)}
              aria-label={format(dict.remove, { name })}
              className="grid size-8 cursor-pointer place-items-center rounded-full text-fg-muted hover:bg-line hover:text-fg"
            >
              <span aria-hidden>×</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-8 cursor-pointer place-items-center rounded-full border border-line text-base hover:bg-line disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
