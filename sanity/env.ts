import { env } from "@/env";

export { apiVersion } from "./studio-env";

export const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
