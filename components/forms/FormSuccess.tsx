"use client";

import { useEffect, useRef } from "react";

import { GlassPanel, GlassPillLink } from "@/components/ui/Glass";

/**
 * What replaces a form once it has gone through: a title, a line of explanation, and optionally where to go next.
 * The submit button that held focus is gone with the form, so the title takes focus: screen-reader users hear the
 * result and the next Tab continues from the message. Focus does the announcing, so there is no `role="status"`
 * (the two together read the title twice).
 */
export function FormSuccess({ title, body, action }: { title: string; body: string; action?: { href: string; label: string } }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <GlassPanel className="max-w-xl p-8">
      <h2 ref={heading} tabIndex={-1} className="font-display text-3xl focus:outline-none">
        {title}
      </h2>
      <p className="mt-3 text-fg-muted">{body}</p>
      {action && (
        <GlassPillLink href={action.href} className="mt-6">
          {action.label}
        </GlassPillLink>
      )}
    </GlassPanel>
  );
}
