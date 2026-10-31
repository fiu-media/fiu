import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";

const Field = ({ tall }: { tall?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <Skeleton className="h-4 w-24" />
    <Skeleton className={`w-full rounded-2xl ${tall ? "h-36" : "h-12"}`} />
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

const Heading = () => <Skeleton className="h-8 w-40" />;

/** Same footprint as the quote form: kit lines, dates, contact details, then the button. */
export function QuoteFormSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-2">
        <Heading />
        <div className="divide-y divide-line">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-14 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <Heading />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field />
          <Field />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <Heading />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field />
          <Field />
          <Field />
          <Field />
        </div>
        <Field />
        <Field tall />
      </section>
      <Skeleton className="h-12 w-44 rounded-full" />
    </SkeletonGroup>
  );
}
