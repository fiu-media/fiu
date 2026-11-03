"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  copiedLabel: string;
  failedLabel: string;
  /** Short note on what the link does and doesn't carry. */
  hint: string;
  /** Called when the button is pressed, so the link reflects the form as it is then. */
  getLink: () => string;
};

/**
 * Copies a link that reopens the form as it is now, for sending to someone else. What goes into the link is the
 * caller's decision (see `quoteHref`); this only copies it, says so (to everyone, including screen readers), and
 * if the browser won't let it copy, shows the link to copy by hand.
 */
export function CopyLinkButton({ label, copiedLabel, failedLabel, hint, getLink }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [link, setLink] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const href = getLink();
    setLink(href);
    try {
      await navigator.clipboard.writeText(href);
      setStatus("copied");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer text-sm font-medium underline underline-offset-4 hover:text-fg-muted"
        >
          {status === "copied" ? copiedLabel : label}
        </button>
        <span className="text-xs text-fg-muted">{hint}</span>
      </div>
      {/* Always rendered, so the change is announced. */}
      <p role="status" className="sr-only">
        {status === "copied" ? copiedLabel : ""}
      </p>
      {status === "failed" && (
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          {failedLabel}
          <input
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2 text-sm text-fg"
          />
        </label>
      )}
    </div>
  );
}
