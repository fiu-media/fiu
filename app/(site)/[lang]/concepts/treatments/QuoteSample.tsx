"use client";

import { controlClass } from "@/components/forms/Field";
import { GlassPanel, GlassPillButton } from "@/components/ui/Glass";
import { cn } from "@/lib/cn";

// The quote form's look, not its behaviour: the site's control styles, with one field showing an error so the accent
// is on show. A client component because the control styles come from the (client) form module.
export function QuoteSample({ radius }: { radius: number }) {
  const control = (invalid?: boolean) => cn(controlClass, "rounded-(--radius-field)", invalid ? "border-accent" : "border-line");
  return (
    <GlassPanel radius={radius} className="p-6 md:p-8">
      <h3 className="font-display text-3xl">Your quote</h3>
      <p className="mt-1 text-sm text-fg-muted">3 items · 12–14 March</p>
      <form className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sample-production" className="text-sm font-medium">
            Production name
          </label>
          <input id="sample-production" className={control()} defaultValue="Solas, Day 2 pickups" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sample-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="sample-email"
            type="email"
            aria-invalid
            aria-describedby="sample-email-error"
            className={control(true)}
            defaultValue="aoife@"
          />
          <p id="sample-email-error" className="text-sm text-accent">
            Enter an email address, like you@example.ie.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sample-notes" className="text-sm font-medium">
            Notes <span className="ml-1.5 font-normal text-fg-muted">(optional)</span>
          </label>
          <textarea id="sample-notes" rows={2} className={control()} placeholder="Anything we should know about the shoot" />
        </div>
        <GlassPillButton type="submit" size="lg" className="mt-2 w-full">
          Request quote
        </GlassPillButton>
      </form>
    </GlassPanel>
  );
}
