import { initBotId } from "botid/client/core";

// Server Actions POST to the page URL, so the pages that host forms are what we protect.
// Add the `/ga/...` equivalents when Irish is enabled.
initBotId({
  protect: [
    { path: "/rentals/quote", method: "POST" },
    { path: "/contact", method: "POST" },
  ],
});
