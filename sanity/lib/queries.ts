import { defineQuery } from "next-sanity";

export const HOME_STILLS_QUERY = defineQuery(`
  *[_type == "siteSettings" && language == $lang][0]{
    _id,
    "stills": homeStills[defined(asset)]{
      _key,
      alt,
      lightTint,
      asset,
      crop,
      hotspot,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions
    }
  }
`);
