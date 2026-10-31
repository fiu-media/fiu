"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import { AddToQuote } from "./AddToQuote";
import { useCatalogue } from "./CatalogueContext";

/** Quantity picker + "Add to quote" for the item page. */
export function DetailAddToQuote({
  itemId,
  itemName,
  dict,
  maxQuantity,
}: {
  itemId: string;
  itemName: string;
  dict: Dictionary["rentals"];
  /** The item's per-quote cap from Sanity, if one is set. */
  maxQuantity: number | null;
}) {
  const [qty, setQty] = useState(1);
  const max = useCatalogue()[itemId]?.max ?? maxQuantity ?? 99;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span>{dict.quantity}</span>
          <input
            type="number"
            min={1}
            max={max}
            value={Math.min(qty, max)}
            onChange={(event) => setQty(Math.min(max, Math.max(1, Math.floor(Number(event.target.value)) || 1)))}
            className="w-20 rounded-2xl border border-line bg-bg-raised px-3 py-2 text-base"
          />
        </label>
        <AddToQuote itemId={itemId} itemName={itemName} dict={dict} size="lg" quantity={Math.min(qty, max)} />
      </div>
      {maxQuantity !== null && <p className="text-sm text-fg-muted">{format(dict.available, { max: maxQuantity })}</p>}
    </div>
  );
}
