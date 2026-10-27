"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { AddToQuote } from "./AddToQuote";

/** Quantity picker + "Add to quote" for the item page. */
export function DetailAddToQuote({ itemId, itemName, dict }: { itemId: string; itemName: string; dict: Dictionary["rentals"] }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span>{dict.quantity}</span>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(event) => setQty(Math.min(99, Math.max(1, Math.floor(Number(event.target.value)) || 1)))}
          className="w-20 rounded-2xl border border-line bg-bg-raised px-3 py-2 text-base"
        />
      </label>
      <AddToQuote itemId={itemId} itemName={itemName} dict={dict} size="lg" quantity={qty} />
    </div>
  );
}
