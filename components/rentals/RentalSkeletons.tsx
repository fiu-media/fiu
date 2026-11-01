import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/** Same footprint as the catalogue: filter chips, then a grid of cards. */
export function CatalogueSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label}>
      <div className="mb-8 flex flex-wrap gap-2">
        {["w-12", "w-24", "w-20", "w-20", "w-32"].map((width, i) => (
          <Skeleton key={i} className={cn("h-8 rounded-full", width)} />
        ))}
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-3xl border border-line bg-bg-raised">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-8 w-32 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonGroup>
  );
}

/**
 * Same footprint as an item page: gallery on the left, details on the right. The slug is
 * runtime data, so the fallback can't know the language and stays silent for screen readers.
 */
export function ItemSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-4 w-24" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-6 w-full" />
          </div>
          <Skeleton className="h-12 w-72 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
