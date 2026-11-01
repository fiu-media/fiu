import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names (like clsx) and resolves Tailwind conflicts so the last one wins: `cn("h-8 px-4", "px-0")` is `"h-8 px-0"`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
