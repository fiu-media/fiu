import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { env } from "@/env";
import { omitUndefined } from "@/lib/omitUndefined";
import { client } from "@/sanity/lib/client";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig(omitUndefined({ token: env.SANITY_API_READ_TOKEN })),
});
