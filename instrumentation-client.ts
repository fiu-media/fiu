import { initBotId } from "botid/client/core";

import { botIdProtectedPaths } from "@/lib/forms/botid";

// Server Actions POST to the page URL, so the pages that host forms are what we protect.
// The list covers every locale (`/contact`, `/ga/contact`, ...), so a new language needs no change here.
initBotId({ protect: botIdProtectedPaths });
