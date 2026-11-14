import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Better Auth's own endpoints, which include the callback Google sends the visitor back to. Starting a sign-in goes
// through `../google/route.ts` and signing out through `../signout/route.ts`; both have a fixed place the proxy knows.
export const { GET, POST } = toNextJsHandler(auth);
