"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { MAX_TALENT } from "@/lib/forms/schemas";
import { format } from "@/lib/i18n/format";
import { chevron, FieldFrame, placeholderClass, type FieldProps } from "./Field";

/** `id` is what the form submits; `slug` is what a link uses to preselect them. */
export type TalentOption = { id: string; name: string; slug: string };

/** Everything the combobox says, including what only a screen reader hears. */
export type TalentComboboxLabels = {
  legend: string;
  optional: string;
  placeholder: string;
  selected: string;
  remove: string;
  chipHint: string;
  inputHint: string;
  open: string;
  empty: string;
  limit: string;
};

type Props = {
  /** The `talent` field. Every pick becomes a hidden input with this name, so the form submits one entry each. */
  field: FieldProps & { defaultOptions: string[] };
  labels: TalentComboboxLabels;
  options: TalentOption[];
};

/**
 * A multi-select that scales with the roster: type to narrow the list, pick from it, and each pick becomes a chip
 * that can be removed. Built on Base UI's Combobox, which owns the keyboard and screen-reader behaviour (arrow
 * keys, Home/End, typeahead, Backspace into the chips, announcements) that is easy to get wrong by hand.
 */
export function TalentCombobox({ field, labels, options }: Props) {
  const items = useMemo(
    () => Combobox.createItems(options, { getValue: (person) => person.id, getLabel: (person) => person.name }),
    [options],
  );
  const [value, setValue] = useState<string[]>(field.defaultOptions);
  const atLimit = value.length >= MAX_TALENT;
  const nameOf = (id: string) => options.find((person) => person.id === id)?.name ?? id;
  if (options.length === 0) return null;

  return (
    <FieldFrame field={field} label={labels.legend} optionalLabel={labels.optional}>
      <Combobox.Root
        multiple
        items={items}
        name={field.name}
        value={value}
        onValueChange={setValue}
        // Keep the list open after a pick, so several people can be chosen from one search.
        onOpenChange={(_open, details) => {
          if (details.reason === "item-press") details.cancel();
        }}
      >
        <Combobox.InputGroup
          className={cn(
            "composite-field flex min-h-12 w-full cursor-text flex-wrap items-center gap-1.5 rounded-2xl border bg-bg-raised py-2 pr-2 pl-4",
            field.errors ? "border-accent" : "border-line",
          )}
        >
          <Combobox.Value>
            {(selected: string[]) => (
              <Combobox.Chips
                className="flex w-full min-w-0 flex-wrap items-center gap-1.5"
                aria-label={selected.length > 0 ? labels.selected : undefined}
              >
                {selected.map((id) => (
                  <Combobox.Chip
                    key={id}
                    aria-label={nameOf(id)}
                    aria-description={labels.chipHint}
                    className="flex items-center gap-1 rounded-full bg-fg py-1 pr-1 pl-3 text-sm text-bg outline-none focus-within:ring-2 focus-within:ring-(--focus) focus-within:ring-offset-1 data-highlighted:ring-2 data-highlighted:ring-(--focus) data-highlighted:ring-offset-1"
                  >
                    {nameOf(id)}
                    <Combobox.ChipRemove
                      aria-label={format(labels.remove, { name: nameOf(id) })}
                      className="grid size-6 cursor-pointer place-items-center rounded-full text-bg/80 hover:bg-bg/20 hover:text-bg"
                    >
                      <X aria-hidden className="size-3.5" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
                <Combobox.Input
                  id={field.id}
                  // The label above is hidden from assistive tech while the list is open, so name it directly too.
                  aria-label={labels.legend}
                  placeholder={selected.length > 0 ? "" : labels.placeholder}
                  aria-invalid={field.ariaInvalid}
                  aria-describedby={field.ariaDescribedBy}
                  aria-description={selected.length > 0 ? format(labels.inputHint, { count: selected.length }) : undefined}
                  className={cn("h-8 min-w-24 flex-1 bg-transparent text-base text-fg outline-none", placeholderClass)}
                />
                <Combobox.Trigger
                  aria-label={labels.open}
                  className="ml-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-line"
                >
                  {chevron}
                </Combobox.Trigger>
              </Combobox.Chips>
            )}
          </Combobox.Value>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className="z-50 outline-none" sideOffset={6}>
            <Combobox.Popup className="max-h-[min(var(--available-height),18rem)] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-raised py-1.5 text-fg shadow-lg transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              <Combobox.Empty>
                <p className="px-4 py-2 text-sm text-fg-muted">{labels.empty}</p>
              </Combobox.Empty>
              {atLimit && <p className="px-4 py-2 text-sm text-fg-muted">{format(labels.limit, { max: MAX_TALENT })}</p>}
              <Combobox.List aria-label={labels.legend}>
                {(person: TalentOption) => (
                  <Combobox.Item
                    key={person.id}
                    value={person.id}
                    disabled={atLimit && !value.includes(person.id)}
                    className="grid cursor-pointer grid-cols-[1.25rem_1fr] items-center gap-2 px-4 py-2 text-base outline-none select-none data-disabled:cursor-default data-disabled:text-fg-muted data-highlighted:bg-line"
                  >
                    <Combobox.ItemIndicator className="col-start-1">
                      <Check aria-hidden className="size-4" />
                    </Combobox.ItemIndicator>
                    <span className="col-start-2">{person.name}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </FieldFrame>
  );
}
