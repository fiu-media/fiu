import { describe, expect, it, vi } from "vitest";

import { at } from "@/lib/at";
import type { TALENT_PROFILE_QUERY_RESULT, TALENT_PROJECTS_QUERY_RESULT, TALENT_QUERY_RESULT } from "@/sanity.types";
import type * as ImageModule from "@/sanity/lib/image";

import { PORTRAIT_INDEX_WIDTH, PORTRAIT_WIDTH, toProfileMeta, toRosterItems, toTalentProfile } from "./mappers";

// Image URLs and edit links need the Sanity env; the mappers under test only pass values through.
vi.mock("@/sanity/lib/image", async (importOriginal) => ({
  ...(await importOriginal<typeof ImageModule>()),
  toSizedImage: (image: { alt: string }, width: number) => ({
    src: `img:${image.alt}:${width}`,
    width,
    height: width,
    alt: image.alt,
  }),
}));

const image = (alt: string) => ({
  alt,
  asset: { _type: "reference" as const, _ref: `image-${alt}-100x100-jpg` },
  crop: null,
  hotspot: null,
  lqip: null,
  dimensions: null,
});

type Person = NonNullable<TALENT_PROFILE_QUERY_RESULT>;

const profile = (extra: Partial<Person> = {}): Person => ({
  _id: "drafts.t1",
  name: "Aoife",
  slug: "aoife",
  roles: ["Director", "Editor"],
  portrait: image("portrait"),
  bio: [],
  talentId: "t1",
  ...extra,
});

const project = (extra: Partial<TALENT_PROJECTS_QUERY_RESULT[number]> = {}): TALENT_PROJECTS_QUERY_RESULT[number] => ({
  _id: "p1",
  title: "Solas",
  slug: "solas",
  typeSlug: "film",
  type: "Film",
  year: 2025,
  client: null,
  vimeoUrl: null,
  previewLoopUrl: null,
  cover: { landscape: image("cover"), portrait: null },
  roles: ["Director"],
  ...extra,
});

describe("toRosterItems", () => {
  const people: TALENT_QUERY_RESULT = [
    { _id: "t1", name: "Aoife", slug: "aoife", roles: ["Director", "Editor"], portrait: image("a") },
    { _id: "t2", name: "Cian", slug: "cian", roles: [], portrait: null },
  ];

  it("lists name, roles and a link to the person's page", () => {
    const [first] = toRosterItems(people, "en");
    expect(first).toMatchObject({ title: "Aoife", meta: "Director, Editor", href: "/talent/aoife" });
    expect(first?.image?.src).toBe(`img:a:${PORTRAIT_INDEX_WIDTH}`);
  });

  it("copes with no roles and no portrait", () => {
    expect(toRosterItems(people, "en")[1]).toMatchObject({ meta: "", image: null });
  });

  it("links within the page's language", () => {
    expect(toRosterItems(people, "ga")[0]?.href).toBe("/ga/talent/aoife");
  });
});

describe("toTalentProfile", () => {
  it("maps the person's fields", () => {
    const result = toTalentProfile(profile(), []);
    expect(result).toMatchObject({ name: "Aoife", roles: "Director, Editor", bio: [], projects: [] });
    expect(result.portrait?.src).toBe(`img:portrait:${PORTRAIT_WIDTH}`);
  });

  it("has no portrait or roles when none are set", () => {
    expect(toTalentProfile(profile({ portrait: null, roles: [] }), [])).toMatchObject({ portrait: null, roles: "" });
  });

  it("points each edit link at the published document", () => {
    const { attrs } = toTalentProfile(profile(), []);
    for (const [field, value] of Object.entries(attrs)) {
      expect(value).toContain("id=t1");
      expect(value).toContain(`path=${field}`);
      expect(value).not.toContain("drafts.");
    }
  });

  it("maps projects as shared slide data plus the person's role", () => {
    const { projects } = toTalentProfile(profile(), [project(), project({ _id: "p2", roles: null })]);
    const first = at(projects, 0);
    const second = at(projects, 1);
    expect(first).toMatchObject({ id: "p1", title: "Solas", meta: "Film · 2025", role: "Director" });
    expect(first.titleAttribute).toContain("id=p1");
    expect(second.role).toBeUndefined();
  });
});

describe("toProfileMeta", () => {
  it("uses the name and the roles", () => {
    expect(toProfileMeta(profile())).toEqual({ title: "Aoife", description: "Director, Editor" });
  });

  it("has no description without roles", () => {
    expect(toProfileMeta(profile({ roles: [] })).description).toBeUndefined();
  });
});
