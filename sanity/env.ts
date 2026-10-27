function assertValue<T>(v: T | undefined, name: string): T {
  if (v === undefined || v === "") throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const apiVersion = "2026-10-01";

export const projectId = assertValue(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, "NEXT_PUBLIC_SANITY_PROJECT_ID");
export const dataset = assertValue(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET");
