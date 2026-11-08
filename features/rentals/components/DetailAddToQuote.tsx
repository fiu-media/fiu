"use client";

import { useId, useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";
import { AddToQuote } from "./AddToQuote";
import { useCatalogue } from "../basket/CatalogueContext";
import { QuantityField } from "./QuantityField";

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
  const id = useId();
  const [qty, setQty] = useState(1);
  const max = useCatalogue()[itemId]?.max ?? maxQuantity ?? 99;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={id}>{dict.quantity}</label>
          <QuantityField
            id={id}
            value={Math.min(qty, max)}
            max={max}
            onChange={setQty}
            decreaseLabel={dict.fewer}
            increaseLabel={dict.more}
          />
        </div>
        <AddToQuote itemId={itemId} itemName={itemName} dict={dict} size="lg" quantity={Math.min(qty, max)} />
      </div>
      {maxQuantity !== null && <p className="text-sm text-fg-muted">{format(dict.available, { max: maxQuantity })}</p>}
    </div>
  );
}
