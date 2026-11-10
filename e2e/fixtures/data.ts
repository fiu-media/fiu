/**
 * The content the e2e suite creates for itself. The tests don't depend on what the dataset already holds: they use
 * these documents, by id and slug, and nothing else. `seed.ts` writes them before the site is built, and `cleanup.ts`
 * removes them (and nothing else) afterwards.
 *
 * This file is plain data with no imports from Sanity or Node, so the specs can import it too.
 */

import { at } from "../../lib/at";

/** Every address the e2e run submits ends in this reserved TLD, which is how cleanup finds the submissions it made. */
export const TEST_EMAIL_DOMAIN = "example.test";

/** Every fixture document has an id and a slug starting with this, which is how cleanup finds them. */
export const FIXTURE_PREFIX = "e2e-";

/** Label on the image assets the fixtures upload, so cleanup can find them without a list. */
export const FIXTURE_ASSET_LABEL = "e2e-fixture";

/** The photos fixtures share out among themselves. Each is a solid colour, so every upload is unique to its run. */
export const PHOTOS = [
  { key: "a", rgb: [196, 74, 63], alt: "A red test photo" },
  { key: "b", rgb: [226, 160, 56], alt: "An amber test photo" },
  { key: "c", rgb: [92, 156, 94], alt: "A green test photo" },
  { key: "d", rgb: [66, 122, 178], alt: "A blue test photo" },
  { key: "e", rgb: [128, 88, 164], alt: "A violet test photo" },
  { key: "f", rgb: [64, 64, 72], alt: "A charcoal test photo" },
] as const;
export type PhotoKey = (typeof PHOTOS)[number]["key"];

export const rentalCategories = {
  cameras: { id: `${FIXTURE_PREFIX}category-cameras`, title: "E2E Cameras", slug: `${FIXTURE_PREFIX}cameras` },
  lighting: { id: `${FIXTURE_PREFIX}category-lighting`, title: "E2E Lighting", slug: `${FIXTURE_PREFIX}lighting` },
} as const;

/**
 * - `single`: one in stock, one photo. The quote can never ask for more than one.
 * - `multi`: five in stock and four photos, for the basket quantity and the photo gallery.
 * - `lighting`: in the other category, so the filter has something to filter out.
 */
export const rentalItems = {
  single: {
    id: `${FIXTURE_PREFIX}rental-single`,
    name: "E2E Single camera",
    slug: `${FIXTURE_PREFIX}single-camera`,
    category: rentalCategories.cameras,
    maxQuantity: 1,
    photos: ["a"],
  },
  multi: {
    id: `${FIXTURE_PREFIX}rental-multi`,
    name: "E2E Gallery lens set",
    slug: `${FIXTURE_PREFIX}gallery-lens-set`,
    category: rentalCategories.cameras,
    maxQuantity: 5,
    photos: ["b", "c", "d", "e"],
  },
  lighting: {
    id: `${FIXTURE_PREFIX}rental-lighting`,
    name: "E2E Soft panel",
    slug: `${FIXTURE_PREFIX}soft-panel`,
    category: rentalCategories.lighting,
    maxQuantity: 3,
    photos: ["f"],
  },
} as const;

export const role = { id: `${FIXTURE_PREFIX}role-director`, title: "E2E Director", slug: `${FIXTURE_PREFIX}director` } as const;

/** More than the 20 people one enquiry can name, so the limit can be reached with talent that is ours. */
export const TALENT_COUNT = 22;
export const talentRoster = Array.from({ length: TALENT_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `${FIXTURE_PREFIX}talent-${n}`,
    name: `E2E Talent ${n}`,
    slug: `${FIXTURE_PREFIX}talent-${n}`,
    path: `/talent/${FIXTURE_PREFIX}talent-${n}`,
  };
});
/** The profile the talent tests open. */
export const featuredTalent = at(talentRoster, 0);

export const projectType = {
  id: `${FIXTURE_PREFIX}type-original`,
  title: "E2E Original",
  pluralTitle: "E2E Originals",
  slug: `${FIXTURE_PREFIX}original`,
} as const;

/** Three stills, so the lightbox has somewhere to step to and wrap around. */
export const project = {
  id: `${FIXTURE_PREFIX}project`,
  title: "E2E Project",
  slug: `${FIXTURE_PREFIX}project`,
  stills: ["a", "b", "c"],
  cover: "d",
} as const;
