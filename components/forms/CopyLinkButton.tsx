"use client";

import { Check, Link, Lock, Share } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { COARSE_POINTER } from "@/lib/media";

type Props = {
  label: string;
  copiedLabel: string;
  failedLabel: string;
  /** Replaces `label` on touch devices that can open the share sheet. */
  shareLabel: string;
  /** The title the share sheet shows with the link. */
  shareTitle: string;
  /** Short note on what the link does and doesn't carry. */
  hint: string;
  /** Called when the button is pressed, so the link reflects the form as it is then. */
  getLink: () => string;
};

// A touch device that can open the system share sheet (Messages, Mail, AirDrop…) offers that instead of copying.
const useCanShare = () => {
  const touch = useMediaQuery(COARSE_POINTER, false);
  return touch && typeof navigator.share === "function";
};

/**
 * Shares a link that reopens the form as it is now: the share sheet on phones, a copy to the clipboard elsewhere. What
 * goes into the link is the caller's decision (see `quoteHref`); this only delivers it, says so (to everyone,
 * including screen readers), and if the browser won't copy, shows the link to copy by hand.
 *
 * It renders into a wrapping flex row of its own, apart from the submit button (the hint is about the link, and must not
 * read as being about sending the form): the hint sits beside the button, or under it where there is no room, and the
 * by-hand fallback takes the full width beneath.
 */
export function CopyLinkButton({ label, copiedLabel, failedLabel, shareLabel, shareTitle, hint, getLink }: Props) {
  const hintId = useId();
  const sharing = useCanShare();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [link, setLink] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(href: string) {
    try {
      await navigator.clipboard.writeText(href);
      setStatus("copied");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  async function press() {
    const href = getLink();
    setLink(href);
    if (sharing) {
      try {
        await navigator.share({ title: shareTitle, url: href });
        return;
      } catch (error) {
        // Closing the sheet is a decision, not a failure. Anything else (sharing refused) falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy(href);
  }

  const copied = status === "copied";
  return (
    <>
      <button
        type="button"
        onClick={press}
        aria-describedby={hintId}
        className="inline-flex h-12 min-w-40 cursor-pointer items-center justify-center gap-2 rounded-full border border-line px-6 text-base font-semibold tracking-[-0.01em] whitespace-nowrap transition-colors select-none hover:border-fg/40 hover:bg-line/40 motion-reduce:transition-none"
      >
        {copied ? (
          <Check aria-hidden className="size-4" />
        ) : sharing ? (
          <Share aria-hidden className="size-4" />
        ) : (
          <Link aria-hidden className="size-4" />
        )}
        {copied ? copiedLabel : sharing ? shareLabel : label}
      </button>
      {/* Always rendered, so the change is announced. */}
      <p role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </p>
      <p id={hintId} className="flex min-w-0 flex-1 basis-56 items-start gap-1.5 text-xs text-fg-muted">
        <Lock aria-hidden className="mt-0.5 size-3 shrink-0" />
        {hint}
      </p>
      {status === "failed" && (
        <label className="flex basis-full flex-col gap-1 text-xs text-fg-muted">
          {failedLabel}
          <input
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2 text-sm text-fg"
          />
        </label>
      )}
    </>
  );
}
