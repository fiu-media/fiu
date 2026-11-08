import { defineQuery } from "next-sanity";

import { byRank, DEFAULT_COUNTERPART, TALENT_CARD_FIELDS, withFallback } from "@/sanity/lib/groq";

/** The Talent index: the roster in the editors' drag-and-drop order. */
export const TALENT_QUERY = defineQuery(`
  ${withFallback("talent", "")}${byRank("name")}{
    ${TALENT_CARD_FIELDS}
  }
`);

/** One person for their bio page. `talentId` is the default-language document that projects credit. */
export const TALENT_PROFILE_QUERY = defineQuery(`
  coalesce(
    *[_type == "talent" && language == $lang && slug.current == $slug][0],
    *[_type == "talent" && language == $fallbackLang && slug.current == $slug][0]
  ){
    ${TALENT_CARD_FIELDS},
    "bio": coalesce(bio, ${DEFAULT_COUNTERPART}.bio),
    "talentId": coalesce(${DEFAULT_COUNTERPART}._id, _id)
  }
`);
