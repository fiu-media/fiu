import { PageTitle } from "@/components/ui/PageTitle";

/** A page's heading block: the title (with its optional Fiú line) and a short intro under it. */
export function PageHeader({
  title,
  tagline,
  intro,
  className,
}: {
  title: string;
  tagline?: string | null;
  intro?: string | null;
  className?: string;
}) {
  return (
    <header className={className}>
      <PageTitle title={title} tagline={tagline} />
      {intro && <p className="mt-4 max-w-2xl text-lg text-fg-muted">{intro}</p>}
    </header>
  );
}
