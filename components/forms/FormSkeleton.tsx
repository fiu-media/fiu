import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

const Field = ({ tall }: { tall?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <Skeleton className="h-4 w-24" />
    <Skeleton className={`w-full rounded-2xl ${tall ? "h-32" : "h-12"}`} />
  </div>
);

/** Placeholder for a form while it hydrates or streams in: label + input rows and the button. */
export function FormSkeleton({ label, fields = 3 }: { label: string; fields?: number }) {
  return (
    <SkeletonGroup label={label} className="flex max-w-xl flex-col gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <Field key={i} />
      ))}
      <Field tall />
      <Skeleton className="mt-2 h-12 w-44 rounded-full" />
    </SkeletonGroup>
  );
}
