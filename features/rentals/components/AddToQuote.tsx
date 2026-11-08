"use client";

import { Check, Plus } from "lucide-react";

import { GlassPillButton } from "@/components/ui/Glass";
import { useQuoteBasket } from "@/features/rentals/basket/store";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { format } from "@/lib/i18n/format";

import { useCatalogue } from "../basket/CatalogueContext";

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
    <GlassPillButton size={size} onClick={() => add(itemId, quantity, max)} aria-pressed={inQuote > 0} disabled={atMax}>
      {inQuote > 0 ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
      <span>{atMax ? dict.maxReached : inQuote > 0 ? format(dict.inQuote, { qty: inQuote }) : dict.addToQuote}</span>
      <span className="sr-only">: {itemName}</span>
    </GlassPillButton>
  );
}
