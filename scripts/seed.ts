/**
 * Seeds placeholder content into the Sanity dataset. Safe to re-run and non-destructive: every
 * document has a fixed _id and is written with createIfNotExists, so anything that already
 * exists (including edits made in the Studio) is left exactly as it is. Image uploads are
 * de-duplicated by hash.
 *
 *   npm run seed
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and an Editor-role
 * SANITY_API_WRITE_TOKEN in .env.local.
 */
import { createReadStream } from "node:fs";
import { basename, join } from "node:path";

import { toolingClient } from "../sanity/tooling-client";

// `published` is the client's default perspective; keep it, so what counts as already existing is unchanged.
const client = toolingClient({ token: "write", perspective: "published" });

// Stills from public/stills, shared out among the sample projects. The mockup's gear photos are
// retailer/stock images, so rental items deliberately get no images until Fiú shoots its own.
const STILLS = [
  { file: "conservatory.jpg", alt: "Conservatory" },
  { file: "banquet.jpg", alt: "Banquet table" },
  { file: "supper.jpg", alt: "Supper" },
  { file: "glow.jpg", alt: "Warm glow" },
  { file: "citrus.jpg", alt: "Citrus" },
  { file: "bouquet.jpg", alt: "Bouquet" },
  { file: "grapes.jpg", alt: "Grapes" },
  { file: "pond.jpg", alt: "Pond" },
  { file: "fur.jpg", alt: "Fur" },
  { file: "parlor.jpg", alt: "Parlor" },
];

async function uploadStill(file: string, alt: string, extra: Record<string, unknown> = {}) {
  const asset = await client.assets.upload("image", createReadStream(join("public/stills", file)), {
    filename: basename(file),
  });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt, ...extra };
}

const text = (key: string, value: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, text: value, marks: [] }],
});

const slug = (current: string) => ({ _type: "slug", current });
const ref = (id: string) => ({ _type: "reference", _ref: id });

const TEAM_CAPTION = "Placeholder caption: the Fiú team on set.";

// The project the home page rotates: the real one's id and slug on the dev and production datasets, which createIfNotExists leaves untouched.
const HOME_PROJECT_ID = "project-and-again-the-vintage-movement";

async function main() {
  const stills = await Promise.all(STILLS.map((s) => uploadStill(s.file, s.alt)));

  const docs: Record<string, unknown>[] = [];
  // The banquet table stands in for the team until Fiú has a photo.
  const teamStill = { ...stills[1], alt: "Placeholder team photo" };

  docs.push({
    _id: "siteSettings",
    _type: "siteSettings",
    language: "en",
    slogan: "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.",
    sloganGloss: "If it's worth doing, it's worth doing right.",
    manifesto: [text("m1", "Placeholder manifesto. Replace this with Fiú's own words in the Studio.")],
    homeProjects: [{ ...ref(HOME_PROJECT_ID), _key: "home-1" }],
    aboutStill: { ...stills[0] },
    teamStill,
    teamCaption: TEAM_CAPTION,
    aboutTagline: "Fiú Words",
    workTagline: "Fiú Reels",
    talentTagline: "Fiú Faces",
    rentalsTagline: "Fiú Bits",
    contactTagline: "Fiú Questions?",
    rentalsIntro:
      "Cameras, lenses, lighting and grip from our own kit room. Build a quote and we'll come back to you with availability and rates.",
    quoteIntro: "Tell us what you need and when, and we'll reply with availability and a quote for your dates.",
    contactIntro: "Tell us about your project, ask about our talent, or say hello.",
    workIntro: "Original productions and commercial work, from first frame to final grade.",
    talentIntro: "The directors, cinematographers and creatives we work with.",
    seoTitle: "Fiú Media",
    seoDescription: "Irish media company: original productions, commercial work, talent and gear rental.",
  });

  const kebab = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const types = [
    { title: "Original", plural: "Originals" },
    { title: "Commercial", plural: "Commercial" },
    { title: "Music video", plural: "Music videos" },
    { title: "Short", plural: "Shorts" },
    { title: "Documentary", plural: "Documentaries" },
  ];
  types.forEach((t) =>
    docs.push({
      _id: `type-${kebab(t.title)}`,
      _type: "projectType",
      language: "en",
      title: t.title,
      pluralTitle: t.plural,
      slug: slug(kebab(t.title)),
    }),
  );

  const roles = ["Director", "Director of Photography", "Producer"];
  roles.forEach((title) =>
    docs.push({ _id: `role-${kebab(title)}`, _type: "role", language: "en", title, slug: slug(kebab(title)) }),
  );

  const talentIds = ["talent-sample-one", "talent-sample-two"];
  talentIds.forEach((id, i) => {
    docs.push({
      _id: id,
      _type: "talent",
      language: "en",
      name: `Sample talent ${i + 1}`,
      slug: slug(`sample-talent-${i + 1}`),
      roles: [{ ...ref(i === 0 ? "role-director" : "role-director-of-photography"), _key: "role-0" }],
      portrait: { ...stills[i] },
      bio: [text("b1", "Placeholder bio.")],
    });
  });

  // The first project is the one the home page shows (HOME_PROJECT_ID). The others are placeholders for the Our Work page.
  types.slice(0, 3).forEach((type, i) => {
    const home = i === 0;
    docs.push({
      _id: home ? HOME_PROJECT_ID : `project-sample-${i + 1}`,
      _type: "project",
      language: "en",
      title: home ? "And Again – The Vintage Movement" : `Sample project ${i + 1}`,
      slug: slug(home ? "and-again-the-vintage-movement" : `sample-project-${i + 1}`),
      type: ref(`type-${home ? "commercial" : kebab(type.title)}`),
      client: home ? "And Again" : type.title === "Original" ? undefined : "Sample client",
      year: 2026,
      coverStill: { ...stills[i] },
      stills: stills.flatMap((s, j) => (j % 3 === i ? [{ ...s, _key: `still-${j}` }] : [])),
      description: [text("d1", "Placeholder description.")],
      credits: [
        { _type: "credit", _key: "c1", role: ref("role-director"), talent: ref(talentIds[0]) },
        { _type: "credit", _key: "c2", role: ref("role-producer"), name: "Sample producer" },
      ],
      featured: i === 0,
    });
  });

  const categories = [
    { id: "cat-cameras", title: "Cameras" },
    { id: "cat-lenses", title: "Lenses" },
    { id: "cat-lighting", title: "Lighting" },
    { id: "cat-grip", title: "Grip & support" },
  ];
  categories.forEach((c) =>
    docs.push({
      _id: c.id,
      _type: "rentalCategory",
      language: "en",
      title: c.title,
      slug: slug(c.title.toLowerCase().replace(/[^a-z]+/g, "-")),
    }),
  );

  const gear = [
    { name: "Sony FX6", brand: "Sony", category: "cat-cameras", summary: "Full-frame cinema line camera." },
    { name: "Nucleus-M follow focus", brand: "Tilta", category: "cat-cameras", summary: "Wireless lens control system." },
    { name: "ARRI SkyPanel S60-C", brand: "ARRI", category: "cat-lighting", summary: "Soft, colour-tunable LED panel." },
    { name: "Avenger YT200 stand", brand: "Avenger", category: "cat-grip", summary: "Heavy-duty light stand." },
    { name: "Rokinon cine lens set", brand: "Rokinon", category: "cat-lenses", summary: "Matched cine prime set." },
  ];
  gear.forEach((g) =>
    docs.push({
      _id: `rental-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      _type: "rentalItem",
      language: "en",
      name: g.name,
      slug: slug(g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      category: ref(g.category),
      brand: g.brand,
      summary: g.summary,
      keyFeatures: [],
      specs: [],
      includedInKit: [],
      available: true,
    }),
  );

  const existing = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: docs.map((d) => d._id) }));
  const missing = docs.filter((doc) => !existing.has(doc._id as string));

  const tx = client.transaction();
  for (const doc of missing) tx.createIfNotExists(doc as { _id: string; _type: string });
  await tx.commit();

  // Fields added to a document type after a dataset was first seeded: filled in only where they are still missing, so
  // an existing Site settings document gets the team photo placeholder and nothing an editor has set is touched.
  // (A caption an editor has deliberately cleared is also missing, so it comes back on the next run.)
  if (existing.has("siteSettings")) {
    await client.patch("siteSettings").setIfMissing({ teamStill, teamCaption: TEAM_CAPTION }).commit();
  }

  console.log(
    `Created ${missing.length} of ${docs.length} documents in ${client.config().dataset}; ${existing.size} already existed and were left untouched.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
