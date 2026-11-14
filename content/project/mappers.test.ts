import { describe, expect, it } from "vitest";

import type { PROJECT_ORDER_QUERY_RESULT, PROJECT_QUERY_RESULT, WORK_QUERY_RESULT } from "@/sanity.types";

import {
  COVER_MOBILE_WIDTH,
  COVER_WIDTH,
  nextProject,
  plainText,
  projectMeta,
  STILL_FULL_WIDTH,
  STILL_THUMB_WIDTH,
  toProject,
  toProjectMeta,
  toProjectSlideData,
  toProjectStills,
  toStills,
  toWorkIndex,
} from "./mappers";

const image = (id: string, width = 4000, height = 3000) => ({
  alt: id,
  asset: { _type: "reference" as const, _ref: `image-${id}-${width}x${height}-jpg` },
  crop: null,
  hotspot: null,
  lqip: null,
  dimensions: { _type: "sanity.imageDimensions" as const, width, height, aspectRatio: width / height },
});

describe("projectMeta", () => {
  it("joins what is set with a middle dot", () => {
    expect(projectMeta({ type: "Film", year: 2025, client: "RTÉ" })).toBe("Film · 2025 · RTÉ");
    expect(projectMeta({ type: "Film", year: null, client: "RTÉ" })).toBe("Film · RTÉ");
    expect(projectMeta({ type: null, year: null, client: null })).toBe("");
  });
});

describe("toProjectSlideData", () => {
  const project = {
    _id: "drafts.p1",
    title: "Solas",
    type: "Film",
    year: 2025,
    client: null,
    vimeoUrl: "https://vimeo.com/1",
    previewLoopUrl: null,
    cover: { landscape: image("cover"), portrait: null },
  };

  it("maps the data props of a slide", () => {
    const data = toProjectSlideData(project);
    expect(data).toMatchObject({
      title: "Solas",
      meta: "Film · 2025",
      vimeoUrl: "https://vimeo.com/1",
      previewLoopUrl: null,
      mobileImage: null,
    });
    expect(data.image?.width).toBe(COVER_WIDTH);
  });

  it("makes the title clickable on the published document", () => {
    const attr = toProjectSlideData(project).titleAttribute;
    expect(attr).toContain("id=p1");
    expect(attr).toContain("type=project");
    expect(attr).toContain("path=title");
  });

  it("sizes the portrait cover for phones", () => {
    const data = toProjectSlideData({ ...project, cover: { landscape: image("cover"), portrait: image("mobile", 3000, 4000) } });
    expect(data.mobileImage?.width).toBe(COVER_MOBILE_WIDTH);
  });

  it("has no image without a cover asset", () => {
    expect(
      toProjectSlideData({ ...project, cover: { landscape: { ...image("x"), asset: null }, portrait: null } }).image,
    ).toBeNull();
  });
});

describe("toStills", () => {
  it("pairs a thumbnail with a full-size image and drops stills without an asset", () => {
    const stills = toStills([image("a"), { ...image("b"), asset: null }, image("c")]);
    expect(stills).toHaveLength(2);
    expect(stills[0]!.thumb.width).toBe(STILL_THUMB_WIDTH);
    expect(stills[0]!.full.width).toBe(STILL_FULL_WIDTH);
  });

  it("treats a missing set as empty", () => {
    expect(toStills(null)).toEqual([]);
    expect(toStills(undefined)).toEqual([]);
  });
});

describe("toProjectStills", () => {
  it("pairs each set on its own and treats a missing set as empty", () => {
    const stills = toProjectStills({ landscape: [image("a"), image("b")], portrait: null });
    expect(stills.landscape).toHaveLength(2);
    expect(stills.portrait).toEqual([]);
  });
});

describe("plainText", () => {
  it("joins the text of each block, skipping empty ones", () => {
    const blocks = [{ children: [{ text: "Hello " }, { text: "there" }] }, { children: [] }, { children: [{ text: "Bye" }] }];
    expect(plainText(blocks)).toBe("Hello there Bye");
  });

  it("is empty without blocks", () => {
    expect(plainText(null)).toBe("");
    expect(plainText(undefined)).toBe("");
  });
});

type WorkProject = WORK_QUERY_RESULT["projects"][number];

const listed = (slug: string, typeSlug: string, extra: Partial<WorkProject> = {}): WorkProject => ({
  _id: `p-${slug}`,
  title: `Title ${slug}`,
  slug,
  typeSlug,
  type: typeSlug,
  year: 2025,
  client: null,
  vimeoUrl: null,
  previewLoopUrl: null,
  cover: { landscape: image(slug), portrait: null },
  ...extra,
});

describe("toWorkIndex", () => {
  const data: WORK_QUERY_RESULT = {
    types: [
      { slug: "film", title: "Films" },
      { slug: "ads", title: "Adverts" },
      { slug: "unused", title: "Unused" },
    ],
    projects: [listed("a", "film"), listed("b", "ads"), listed("c", "film")],
  };
  const titles = (slides: { title: string }[]) => slides.map((slide) => slide.title);

  it("shows everything and offers only types that have projects", () => {
    const { filters, slides } = toWorkIndex(data, "en", undefined);
    expect(filters.active).toBeNull();
    expect(filters.usable.map((type) => type.slug)).toEqual(["film", "ads"]);
    expect(titles(slides)).toEqual(["Title a", "Title b", "Title c"]);
  });

  it("narrows to the requested type", () => {
    const { filters, slides } = toWorkIndex(data, "en", "film");
    expect(filters.active).toBe("film");
    expect(titles(slides)).toEqual(["Title a", "Title c"]);
  });

  it("falls back to everything for an unknown or unused type", () => {
    expect(toWorkIndex(data, "en", "nope").slides).toHaveLength(3);
    expect(toWorkIndex(data, "en", "unused")).toMatchObject({ filters: { active: null }, slides: expect.any(Array) });
  });

  it("links each slide to its project's page in the locale", () => {
    expect(toWorkIndex(data, "ga", undefined).slides[0]).toMatchObject({ id: "p-a", href: "/ga/work/a" });
  });
});

describe("nextProject", () => {
  const order: PROJECT_ORDER_QUERY_RESULT = [
    { title: "A", slug: "a" },
    { title: "B", slug: "b" },
    { title: "C", slug: "c" },
  ];

  it("is the project after this one", () => {
    expect(nextProject(order, "a", "en")).toEqual({ title: "B", href: "/work/b" });
  });

  it("wraps round to the first project", () => {
    expect(nextProject(order, "c", "ga")).toEqual({ title: "A", href: "/ga/work/a" });
  });

  it("is null when this is the only project or it isn't listed", () => {
    expect(nextProject([order[0]!], "a", "en")).toBeNull();
    expect(nextProject(order, "missing", "en")).toBeNull();
  });
});

describe("toProject", () => {
  const project = {
    ...listed("a", "film", { client: "RTÉ" }),
    description: null,
    credits: [
      { _key: "k1", role: "Director", name: "Aoife", talentSlug: "aoife" },
      { _key: "k2", role: "Sound", name: "Guest", talentSlug: null },
      { _key: "k3", role: "Grade", name: null, talentSlug: null },
    ],
    stills: { landscape: [{ ...image("s1"), _key: "s1" }], portrait: [] },
  } satisfies NonNullable<PROJECT_QUERY_RESULT>;

  it("lists credits with a name, linking the ones that are on the roster", () => {
    const { credits } = toProject(project, [{ title: "A", slug: "a" }], "ga");
    expect(credits).toEqual([
      { key: "k1", role: "Director", name: "Aoife", href: "/ga/talent/aoife" },
      { key: "k2", role: "Sound", name: "Guest", href: null },
    ]);
  });

  it("builds the hero slide, the stills and the next project", () => {
    const order = [
      { title: "A", slug: "a" },
      { title: "B", slug: "b" },
    ];
    const page = toProject(project, order, "en");
    expect(page.slide).toMatchObject({ title: "Title a", meta: "film · 2025 · RTÉ" });
    expect(page.descriptionAttribute).toContain("path=description");
    expect(page.stills.landscape).toHaveLength(1);
    expect(page.stills.portrait).toEqual([]);
    expect(page.next).toEqual({ title: "B", href: "/work/b" });
  });
});

describe("toProjectMeta", () => {
  const meta = { title: "Solas", type: "Film", year: 2025, client: null };

  it("describes the project with its blurb", () => {
    const description = [
      { _type: "block" as const, _key: "b1", children: [{ _type: "span" as const, _key: "s1", text: "A story." }] },
    ];
    expect(toProjectMeta({ ...meta, description })).toEqual({
      title: "Solas",
      description: "A story.",
    });
  });

  it("falls back to the line under the title, then to nothing", () => {
    expect(toProjectMeta({ ...meta, description: null }).description).toBe("Film · 2025");
    expect(
      toProjectMeta({ title: "Solas", type: null, year: null, client: null, description: null }).description,
    ).toBeUndefined();
  });
});
