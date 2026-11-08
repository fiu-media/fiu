"use client";

import { type RefObject, useLayoutEffect } from "react";

/**
 * Sizes a textarea to its content, for browsers without CSS `field-sizing: content` (which does this by itself, and
 * is what the textarea's classes ask for). The CSS min and max height still bound it; past the max it scrolls.
 * Does nothing where `field-sizing` is supported.
 */
export function useAutoGrow(ref: RefObject<HTMLTextAreaElement | null>) {
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea || CSS.supports("field-sizing", "content")) return;

    const fit = () => {
      textarea.style.height = "auto";
      // scrollHeight leaves out the borders, which `height` (border-box) includes.
      textarea.style.height = `${textarea.scrollHeight + (textarea.offsetHeight - textarea.clientHeight)}px`;
    };
    fit();

    // Typing, and the form putting a value back: Conform dispatches `input` when it sets a value; React's own reset after a
    // submit doesn't, so that is listened for too (after it has restored the value).
    let reset: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      reset = setTimeout(fit, 0);
    };
    textarea.addEventListener("input", fit);
    textarea.form?.addEventListener("reset", onReset);
    // Wrapping changes with the width (a rotated phone, a resized window), and so does the height the text needs.
    let width = textarea.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (textarea.offsetWidth !== width) {
        width = textarea.offsetWidth;
        fit();
      }
    });
    observer.observe(textarea);

    return () => {
      textarea.removeEventListener("input", fit);
      textarea.form?.removeEventListener("reset", onReset);
      observer.disconnect();
      clearTimeout(reset);
    };
  }, [ref]);
}
