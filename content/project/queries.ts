import { defineQuery } from "next-sanity";

import {
  byRank,
  DEFAULT_COUNTERPART,
  PROJECT_SLIDE_FIELDS,
  responsiveImages,
  translatedTitle,
  withFallback,
} from "@/sanity/lib/groq";

/** The projects a person is credited on, in the editors' drag-and-drop order, with what they did on each. */
export const TALENT_PROJECTS_QUERY = defineQuery(`
  ${withFallback("project", " && references($talentId)")}${byRank("title")}{
    ${PROJECT_SLIDE_FIELDS},
    "roles": credits[talent._ref == $talentId].role->{ "title": ${translatedTitle("role")} }.title
  }
`);

/** Our Work: every project in the editors' drag-and-drop order, and the types that filter them. */
export const WORK_QUERY = defineQuery(`{
  "types": ${withFallback("projectType", "")}${byRank("title")}{
    "slug": slug.current,
    "title": coalesce(pluralTitle, title)
  },
  "projects": ${withFallback("project", "")}${byRank("title")}{
    ${PROJECT_SLIDE_FIELDS}
  }
}`);

/**
 * One project for its own page. Credits are read-only in translations and the description and stills may not be
 * translated yet, so each falls back to the default-language document's.
 */
export const PROJECT_QUERY = defineQuery(`
  coalesce(
    *[_type == "project" && language == $lang && slug.current == $slug][0],
    *[_type == "project" && language == $fallbackLang && slug.current == $slug][0]
  ){
    ${PROJECT_SLIDE_FIELDS},
    "description": coalesce(description, ${DEFAULT_COUNTERPART}.description),
    "credits": coalesce(credits, ${DEFAULT_COUNTERPART}.credits)[]{
      _key,
      "role": role->{ "title": ${translatedTitle("role")} }.title,
      "name": coalesce(talent->name, name),
      "talentSlug": talent->slug.current
    },
    "stills": ${responsiveImages("stills", "stillsMobile")}
  }
`);

/** Every project's title and slug in the editors' order, for "next project". */
export const PROJECT_ORDER_QUERY = defineQuery(`
  ${withFallback("project", "")}${byRank("title")}{
    title,
    "slug": slug.current
  }
`);
