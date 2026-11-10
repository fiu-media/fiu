"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { prefillKey } from "@/lib/forms/prefill";

import { useFreshOnArrival } from "./useFreshOnArrival";

/**
 * Starts a form over whenever a link arrives with something to prefill (see `useFreshOnArrival`). `params` are the
 * query parameters the form reads; give the form the key it is passed.
 */
export function PrefillBoundary({ params, children }: { params: readonly string[]; children: (key: number) => ReactNode }) {
  const fresh = useFreshOnArrival(prefillKey(useSearchParams(), params));
  return children(fresh);
}
