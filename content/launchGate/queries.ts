import { defineQuery } from "next-sanity";

/** The one launch document, published only. */
export const LAUNCH_AT_QUERY = defineQuery(`*[_type == "launchGate" && _id == "launchGate"][0].launchAt`);
