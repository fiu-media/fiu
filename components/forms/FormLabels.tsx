"use client";

import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from "react";

/** A field's visible label, and the DOM id the error summary links to. */
export type FormLabel = { name: string; label: string; id: string };

type Registry = {
  labels: readonly FormLabel[];
  register: (entry: FormLabel) => () => void;
};

const FormLabelsContext = createContext<Registry | null>(null);

/**
 * Collects the label of every field in a form, so the error summary can name them without the form listing each one
 * a second time. Provided once by `<Form>`.
 */
export function FormLabelsProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<readonly FormLabel[]>([]);
  const register = useCallback((entry: FormLabel) => {
    setEntries((current) => [...current.filter((e) => e.name !== entry.name), entry]);
    return () => setEntries((current) => current.filter((e) => e !== entry));
  }, []);
  const value = useMemo(() => ({ labels: entries, register }), [entries, register]);
  return <FormLabelsContext value={value}>{children}</FormLabelsContext>;
}

/** The labels registered so far, in no particular order (see `inPageOrder`). */
export function useFormLabels() {
  return use(FormLabelsContext)!.labels;
}

/** Register a field's label with the surrounding `<Form>`. Called by `<Field>`, and directly for anything else the summary should name. */
export function useFormLabel(field: { name: string; id: string }, label: string) {
  const { register } = use(FormLabelsContext)!;
  const { name, id } = field;
  useEffect(() => register({ name, label, id }), [register, name, label, id]);
}

/** For a part of the form that isn't a `<Field>` (the quote's kit) but can fail validation. Renders nothing. */
export function RegisterLabel({ field, label }: { field: { name: string; id: string }; label: string }) {
  useFormLabel(field, label);
  return null;
}

/**
 * The labels as the fields appear on the page, so the summary reads top to bottom like the form, however and whenever the
 * fields came to be registered. Labels whose element isn't on the page are dropped.
 */
export function inPageOrder(labels: readonly FormLabel[]) {
  const placed = labels.flatMap((entry) => {
    const element = document.getElementById(entry.id);
    return element ? [{ entry, element }] : [];
  });
  placed.sort((a, b) =>
    a.element === b.element ? 0 : a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  return placed.map(({ entry }) => entry);
}
