import { defineQuery } from "next-sanity";

export const HOME_STILLS_QUERY = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    _id,
    "stills": homeStills[defined(asset)]{
      _key,
      alt,
      asset,
      crop,
      hotspot,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions
    }
  }
`);
