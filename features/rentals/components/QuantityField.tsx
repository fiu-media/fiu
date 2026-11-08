"use client";

import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";

import { clampQty } from "@/features/rentals/basket/quantity";

const stepClass =
  "grid size-8 cursor-pointer place-items-center rounded-full border border-line text-base hover:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:bg-transparent";

type Props = {
  value: number;
  onChange: (qty: number) => void;
  /** The item's cap; the field never goes past it (or `MAX_QTY`). */
  max: number;
  /** The input's accessible name, unless a visible `<label htmlFor={id}>` names it. */
  label?: string;
  decreaseLabel: string;
  increaseLabel: string;
  id?: string;
  className?: string;
};

/**
 * A quantity that can be typed or stepped with − and +, the arrow keys, Home/End and Page Up/Down. Built on Base UI's
 * NumberField, which owns the keyboard, clamping and screen-reader behaviour; we just keep it to whole numbers.
 */
export function QuantityField({ value, onChange, max, label, decreaseLabel, increaseLabel, id, className }: Props) {
  return (
    <NumberField.Root
      id={id}
      value={value}
      min={1}
      max={max}
      largeStep={5}
      format={{ maximumFractionDigits: 0 }}
      // Clearing the field to type a new number leaves it empty for a moment; the quantity only follows real numbers.
      onValueChange={(next) => next !== null && onChange(clampQty(next, max))}
      className={className}
    >
      <NumberField.Group className="flex items-center gap-1">
        <NumberField.Decrement aria-label={decreaseLabel} className={stepClass}>
          <Minus aria-hidden className="size-4" />
        </NumberField.Decrement>
        <NumberField.Input
          aria-label={label}
          className="h-8 w-10 rounded-lg bg-transparent text-center text-base tabular-nums sm:text-sm"
        />
        <NumberField.Increment aria-label={increaseLabel} className={stepClass}>
          <Plus aria-hidden className="size-4" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
