import { GlassPanel, GlassPillLink } from "@/components/ui/Glass";

/** What replaces a form once it has gone through: a title, a line of explanation, and optionally where to go next. */
export function FormSuccess({ title, body, action }: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <GlassPanel className="max-w-xl p-8" role="status">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-3 text-fg-muted">{body}</p>
      {action && (
        <GlassPillLink href={action.href} className="mt-6">
          {action.label}
        </GlassPillLink>
      )}
    </GlassPanel>
  );
}
