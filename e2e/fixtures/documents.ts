import { featuredTalent, project, projectType, rentalCategories, rentalItems, role, talentRoster, type PhotoKey } from "./data";

type Doc = { _id: string; _type: string; [field: string]: unknown };

const ref = (id: string) => ({ _type: "reference", _ref: id });
const slug = (current: string) => ({ _type: "slug", current });
const paragraph = (key: string, text: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
});

/** The documents the suite creates, given the id of the uploaded image asset for each photo. */
export function fixtureDocuments(assets: Record<PhotoKey, string>): Doc[] {
  const alt = (key: PhotoKey) => `Test photo ${key.toUpperCase()}`;
  const image = (key: PhotoKey) => ({ _type: "image", asset: ref(assets[key]), alt: alt(key) });
  const arrayImage = (key: PhotoKey, i: number) => ({ ...image(key), _key: `photo-${i}` });

  const docs: Doc[] = [];

  for (const category of Object.values(rentalCategories)) {
    docs.push({ _id: category.id, _type: "rentalCategory", language: "en", title: category.title, slug: slug(category.slug) });
  }

  for (const item of Object.values(rentalItems)) {
    docs.push({
      _id: item.id,
      _type: "rentalItem",
      language: "en",
      name: item.name,
      slug: slug(item.slug),
      category: ref(item.category.id),
      brand: "E2E",
      images: item.photos.map(arrayImage),
      summary: `A test item with ${item.maxQuantity} in stock.`,
      keyFeatures: ["Made for the test suite"],
      specs: [{ _type: "spec", _key: "spec-1", key: "Stock", value: String(item.maxQuantity) }],
      includedInKit: ["A case"],
      maxQuantity: item.maxQuantity,
      available: true,
    });
  }

  docs.push({ _id: role.id, _type: "role", language: "en", title: role.title, slug: slug(role.slug) });

  for (const person of talentRoster) {
    docs.push({
      _id: person.id,
      _type: "talent",
      language: "en",
      name: person.name,
      slug: slug(person.slug),
      roles: [{ ...ref(role.id), _key: "role-0" }],
      portrait: image("f"),
      bio: [paragraph("bio", "A test person.")],
      available: true,
    });
  }

  docs.push({
    _id: projectType.id,
    _type: "projectType",
    language: "en",
    title: projectType.title,
    pluralTitle: projectType.pluralTitle,
    slug: slug(projectType.slug),
  });

  docs.push({
    _id: project.id,
    _type: "project",
    language: "en",
    title: project.title,
    slug: slug(project.slug),
    type: ref(projectType.id),
    client: "E2E Client",
    year: 2026,
    coverStill: image(project.cover),
    stills: project.stills.map(arrayImage),
    description: [paragraph("description", "A test project.")],
    credits: [{ _type: "credit", _key: "credit-1", role: ref(role.id), talent: ref(featuredTalent.id) }],
    featured: false,
  });

  return docs;
}
