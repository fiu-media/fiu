"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type SVGProps } from "react";

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

const icon = (props: SVGProps<SVGSVGElement>) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});
const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...icon(props)}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </svg>
);
const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...icon(props)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const ShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...icon(props)}>
    <path d="M12 15V3" />
    <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
const LockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...icon({ width: 12, height: 12, ...props })}>
    <rect x="4.5" y="11" width="15" height="10" rx="2" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </svg>
);

// A touch device that can open the system share sheet (Messages, Mail, AirDrop…) offers that instead of copying.
const subscribeToPointer = (onChange: () => void) => {
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const canShare = () => typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
const useCanShare = () => useSyncExternalStore(subscribeToPointer, canShare, () => false);

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
        {copied ? <CheckIcon /> : sharing ? <ShareIcon /> : <LinkIcon />}
        {copied ? copiedLabel : sharing ? shareLabel : label}
      </button>
      {/* Always rendered, so the change is announced. */}
      <p role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </p>
      <p id={hintId} className="flex min-w-0 flex-1 basis-56 items-start gap-1.5 text-xs text-fg-muted">
        <LockIcon className="mt-0.5 shrink-0" />
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
