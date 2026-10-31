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
import { createClient } from "@sanity/client";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} (set it in .env.local)`);
  return value;
}

const client = createClient({
  projectId: env("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: env("NEXT_PUBLIC_SANITY_DATASET"),
  token: env("SANITY_API_WRITE_TOKEN"),
  apiVersion: "2026-10-01",
  useCdn: false,
});

// Hero stills from public/stills. The mockup's gear photos are retailer/stock images, so rental
// items deliberately get no images until Fiú shoots its own.
// Keep the tints in sync with lib/fallback-stills.ts.
const STILLS = [
  { file: "conservatory.jpg", alt: "Conservatory", lightTint: "#a0957b" },
  { file: "banquet.jpg", alt: "Banquet table", lightTint: "#866249" },
  { file: "supper.jpg", alt: "Supper", lightTint: "#916d54" },
  { file: "glow.jpg", alt: "Warm glow", lightTint: "#956444" },
  { file: "citrus.jpg", alt: "Citrus", lightTint: "#968a77" },
  { file: "bouquet.jpg", alt: "Bouquet", lightTint: "#977980" },
  { file: "grapes.jpg", alt: "Grapes", lightTint: "#a39f82" },
  { file: "pond.jpg", alt: "Pond", lightTint: "#746e67" },
  { file: "fur.jpg", alt: "Fur", lightTint: "#8c5648" },
  { file: "parlor.jpg", alt: "Parlor", lightTint: "#716755" },
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

async function main() {
  const stills = await Promise.all(STILLS.map((s) => uploadStill(s.file, s.alt)));
  const tinted = stills.map((s, i) => ({ ...s, lightTint: STILLS[i].lightTint }));

  const docs: Record<string, unknown>[] = [];

  docs.push({
    _id: "siteSettings",
    _type: "siteSettings",
      language: "en",
    slogan: "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.",
    sloganGloss: "If it's worth doing, it's worth doing right.",
    manifesto: [text("m1", "Placeholder manifesto. Replace this with Fiú's own words in the Studio.")],
    homeStills: tinted.map((s, i) => ({ ...s, _key: `home-${i}` })),
    aboutStill: { ...stills[0] },
    aboutTagline: "Fiú Words",
    workTagline: "Fiú Reels",
    talentTagline: "Fiú Faces",
    rentalsTagline: "Fiú Bits",
    contactTagline: "Fiú Questions?",
    rentalsIntro:
      "Cameras, lenses, lighting and grip from our own kit room. Build a quote and we'll come back to you with availability and rates.",
    quoteIntro: "Tell us what you need and when, and we'll reply with availability and a quote for your dates.",
    contactIntro: "Tell us about your project, ask about our talent, or say hello.",
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

  types.slice(0, 3).forEach((type, i) => {
    docs.push({
      _id: `project-sample-${i + 1}`,
      _type: "project",
      language: "en",
      title: `Sample project ${i + 1}`,
      slug: slug(`sample-project-${i + 1}`),
      type: ref(`type-${kebab(type.title)}`),
      client: type.title === "Original" ? undefined : "Sample client",
      year: 2026,
      coverStill: { ...stills[i] },
      stills: stills.map((s, j) => ({ ...s, _key: `still-${j}` })),
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
  console.log(
    `Created ${missing.length} of ${docs.length} documents in ${client.config().dataset}; ${existing.size} already existed and were left untouched.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
