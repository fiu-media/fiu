"use client";

import { GlassPillButton } from "@/components/ui/Glass";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useQuoteBasket } from "@/lib/quote-basket";
import { useCatalogue } from "./CatalogueContext";

export function AddToQuote({
  itemId,
  itemName,
  dict,
  size = "md",
  quantity = 1,
}: {
  itemId: string;
  itemName: string;
  dict: Dictionary["rentals"];
  size?: "sm" | "md" | "lg";
  quantity?: number;
}) {
  const { lines, add } = useQuoteBasket();
  const max = useCatalogue()[itemId]?.max ?? 99;
  const inQuote = lines.find((l) => l.itemId === itemId)?.qty ?? 0;
  const atMax = inQuote >= max;
  return (
    <GlassPillButton
      size={size}
      onClick={() => add(itemId, quantity, max)}
      aria-pressed={inQuote > 0}
      disabled={atMax}
    >
      <span aria-hidden>{inQuote > 0 ? "✓" : "+"}</span>
      <span>{atMax ? dict.maxReached : inQuote > 0 ? format(dict.inQuote, { qty: inQuote }) : dict.addToQuote}</span>
      <span className="sr-only">: {itemName}</span>
    </GlassPillButton>
  );
}
