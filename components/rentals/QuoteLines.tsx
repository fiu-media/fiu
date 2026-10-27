"use client";

import Link from "next/link";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useQuoteBasket } from "@/lib/quote-basket";
import { useCatalogue } from "./CatalogueContext";
import { RentalImageView } from "./RentalImageView";

/** Basket lines with quantity steppers; shared by the drawer and the quote form. */
export function QuoteLines({ dict, onNavigate }: { dict: Dictionary["basket"]; onNavigate?: () => void }) {
  const { lines, setQty, remove } = useQuoteBasket();
  const catalogue = useCatalogue();

  return (
    <ul className="divide-y divide-line">
      {lines.map(({ itemId, qty }) => {
        const item = catalogue[itemId];
        const name = item?.name ?? dict.unknownItem;
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
              <StepButton label={format(dict.decrease, { name })} onClick={() => setQty(itemId, qty - 1)}>
                −
              </StepButton>
              <output aria-live="polite" className="w-7 text-center text-sm tabular-nums">
                {qty}
              </output>
              <StepButton label={format(dict.increase, { name })} onClick={() => setQty(itemId, qty + 1)}>
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

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 cursor-pointer place-items-center rounded-full border border-line text-base hover:bg-line"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
