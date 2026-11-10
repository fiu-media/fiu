import { defineQuery } from "next-sanity";

import { IMAGE_FIELDS } from "@/sanity/lib/groq";

/** Recipient addresses for form notifications, falling back to the default language's settings. */
export const SUBMISSION_SETTINGS_QUERY = defineQuery(`
  coalesce(
    *[_type == "siteSettings" && language == $lang][0],
    *[_type == "siteSettings" && language == $fallbackLang][0]
  ){ contactEmail, quoteRecipient }
`);

/**
 * @deprecated Read `getSiteSettings` instead; kept until the pages that use this move over.
 *
 * Editor-written intro lines for the Rentals, Request a quote, Contact, Our Work and Talent pages, plus each page's Fiú line.
 */
export const PAGE_TEXT_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ rentalsIntro, quoteIntro, contactIntro, workIntro, talentIntro, aboutTagline, workTagline, talentTagline, rentalsTagline, contactTagline },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ rentalsIntro, quoteIntro, contactIntro, workIntro, talentIntro, aboutTagline, workTagline, talentTagline, rentalsTagline, contactTagline }
}{
  "rentalsIntro": coalesce(cur.rentalsIntro, fb.rentalsIntro),
  "quoteIntro": coalesce(cur.quoteIntro, fb.quoteIntro),
  "contactIntro": coalesce(cur.contactIntro, fb.contactIntro),
  "workIntro": coalesce(cur.workIntro, fb.workIntro),
  "talentIntro": coalesce(cur.talentIntro, fb.talentIntro),
  "aboutTagline": coalesce(cur.aboutTagline, fb.aboutTagline),
  "workTagline": coalesce(cur.workTagline, fb.workTagline),
  "talentTagline": coalesce(cur.talentTagline, fb.talentTagline),
  "rentalsTagline": coalesce(cur.rentalsTagline, fb.rentalsTagline),
  "contactTagline": coalesce(cur.contactTagline, fb.contactTagline)
}`);

/**
 * The stills of the projects the home page rotates, in the editors' order. A project's stills may not be translated
 * yet, so each set falls back to the default-language document's, like on its own page.
 */
export const HOME_STILLS_QUERY = defineQuery(`
  coalesce(
    *[_type == "siteSettings" && language == $lang && count(homeProjects) > 0][0],
    *[_type == "siteSettings" && language == $fallbackLang][0]
  ){
    "projects": homeProjects[]->{
      _id,
      "stills": coalesce(
        *[_type == "project" && language == $lang && slug.current == ^.slug.current][0].stills,
        stills
      )[defined(asset)]{ _key, ${IMAGE_FIELDS} },
      "stillsMobile": coalesce(
        *[_type == "project" && language == $lang && slug.current == ^.slug.current][0].stillsMobile,
        stillsMobile
      )[defined(asset)]{ _key, ${IMAGE_FIELDS} }
    }
  }
`);

/** Every Site settings field the site reads; the same projection runs on the current and the default language's document. */
const SITE_SETTINGS_FIELDS = `
  _id, slogan, sloganGloss, manifesto, contactEmail, instagram, teamCaption,
  rentalsIntro, quoteIntro, contactIntro, workIntro, talentIntro,
  aboutTagline, workTagline, talentTagline, rentalsTagline, contactTagline,
  "aboutStill": aboutStill{ ${IMAGE_FIELDS} },
  "teamStill": teamStill{ ${IMAGE_FIELDS} }
` as const;

/**
 * Everything the site reads from Site settings, in one query: each field falls back to the default language's, and an
 * image falls back as a whole (a translation with no asset shows the default language's).
 */
export const SITE_SETTINGS_QUERY = defineQuery(`{
  "cur": *[_type == "siteSettings" && language == $lang][0]{ ${SITE_SETTINGS_FIELDS} },
  "fb": *[_type == "siteSettings" && language == $fallbackLang][0]{ ${SITE_SETTINGS_FIELDS} }
}{
  "_id": coalesce(cur._id, fb._id),
  "slogan": coalesce(cur.slogan, fb.slogan),
  "sloganGloss": coalesce(cur.sloganGloss, fb.sloganGloss),
  "manifesto": coalesce(cur.manifesto, fb.manifesto),
  "contactEmail": coalesce(cur.contactEmail, fb.contactEmail),
  "instagram": coalesce(cur.instagram, fb.instagram),
  "teamCaption": coalesce(cur.teamCaption, fb.teamCaption),
  "rentalsIntro": coalesce(cur.rentalsIntro, fb.rentalsIntro),
  "quoteIntro": coalesce(cur.quoteIntro, fb.quoteIntro),
  "contactIntro": coalesce(cur.contactIntro, fb.contactIntro),
  "workIntro": coalesce(cur.workIntro, fb.workIntro),
  "talentIntro": coalesce(cur.talentIntro, fb.talentIntro),
  "aboutTagline": coalesce(cur.aboutTagline, fb.aboutTagline),
  "workTagline": coalesce(cur.workTagline, fb.workTagline),
  "talentTagline": coalesce(cur.talentTagline, fb.talentTagline),
  "rentalsTagline": coalesce(cur.rentalsTagline, fb.rentalsTagline),
  "contactTagline": coalesce(cur.contactTagline, fb.contactTagline),
  "aboutStill": select(defined(cur.aboutStill.asset) => cur.aboutStill, fb.aboutStill),
  "teamStill": select(defined(cur.teamStill.asset) => cur.teamStill, fb.teamStill)
}`);
