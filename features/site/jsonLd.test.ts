import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/siteUrl", () => ({
  siteUrl: "https://fiu.test",
  absoluteUrl: (path: string) => (path === "/" ? "https://fiu.test" : `https://fiu.test${path}`),
}));

import { aboutGraph, breadcrumbList, organizationId, organizationNode, personGraph, projectGraph, siteGraph } from "./jsonLd";

describe("organizationNode", () => {
  it("names the company, Ireland, and how to reach them", () => {
    expect(
      organizationNode({
        name: "Fiú Media",
        description: "Irish media company.",
        email: "hello@fiu.ie",
        instagramUrl: "https://instagram.com/fiumedia",
      }),
    ).toMatchObject({
      "@type": "Organization",
      "@id": "https://fiu.test/#organization",
      name: "Fiú Media",
      legalName: "Fiu Media Limited",
      email: "hello@fiu.ie",
      address: { addressCountry: "IE" },
      areaServed: { name: "Ireland" },
      sameAs: ["https://instagram.com/fiumedia"],
      contactPoint: { email: "hello@fiu.ie", contactType: "customer service" },
      logo: { "@type": "ImageObject", width: 512, height: 512 },
    });
  });

  it("omits contact and sameAs when the editors have not set them", () => {
    const node = organizationNode({ name: "Fiú Media", description: "Irish media company." });
    expect(node).not.toHaveProperty("email");
    expect(node).not.toHaveProperty("contactPoint");
    expect(node).not.toHaveProperty("sameAs");
  });
});

describe("siteGraph", () => {
  it("pairs the organisation with the website", () => {
    const graph = siteGraph({ name: "Fiú Media", description: "Irish media company." });
    expect(graph["@graph"]).toHaveLength(2);
    expect(graph["@graph"][0]).toMatchObject({ "@type": "Organization" });
    expect(graph["@graph"][1]).toMatchObject({
      "@type": "WebSite",
      publisher: { "@id": organizationId() },
      inLanguage: ["en-IE", "ga-IE"],
    });
  });
});

describe("aboutGraph", () => {
  it("reuses the organisation id on an AboutPage", () => {
    const [org, page] = aboutGraph({
      lang: "ga",
      title: "About",
      name: "Fiú Media",
      description: "Irish media company.",
    })["@graph"];
    expect(org).toMatchObject({ "@id": organizationId() });
    expect(page).toMatchObject({
      "@type": "AboutPage",
      url: "https://fiu.test/ga/about",
      about: { "@id": organizationId() },
      mainEntity: { "@id": organizationId() },
      inLanguage: "ga-IE",
    });
  });
});

describe("breadcrumbList", () => {
  it("numbers each crumb with an absolute URL in the page language", () => {
    expect(
      breadcrumbList("ga", [
        { name: "Fiú Media", path: "/" },
        { name: "Our Work", path: "/work" },
        { name: "Solas", path: "/work/solas" },
      ]),
    ).toEqual({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Fiú Media", item: "https://fiu.test/ga" },
        { "@type": "ListItem", position: 2, name: "Our Work", item: "https://fiu.test/ga/work" },
        { "@type": "ListItem", position: 3, name: "Solas", item: "https://fiu.test/ga/work/solas" },
      ],
    });
  });
});

describe("projectGraph", () => {
  const base = {
    lang: "en" as const,
    title: "Solas",
    slug: "solas",
    description: "A short film.",
    type: "Film",
    year: 2025,
    client: "RTÉ",
    imageUrl: "https://cdn.test/cover.jpg",
    credits: [
      { role: "Director", name: "Aoife", path: "/talent/aoife" },
      { role: "Sound", name: "Guest" },
    ],
    crumbs: { home: "Fiú Media", work: "Our Work" },
  };

  it("emits a VideoObject when the project has a Vimeo film", () => {
    const [work, crumbs] = projectGraph({ ...base, vimeoUrl: "https://vimeo.com/123456" })["@graph"];
    expect(work).toMatchObject({
      "@type": "VideoObject",
      name: "Solas",
      url: "https://fiu.test/work/solas",
      embedUrl: "https://player.vimeo.com/video/123456?dnt=1",
      contentUrl: "https://vimeo.com/123456",
      thumbnailUrl: "https://cdn.test/cover.jpg",
      uploadDate: "2025-01-01",
      genre: "Film",
      sourceOrganization: { name: "RTÉ" },
      publisher: { "@id": organizationId() },
      contributor: [
        { "@type": "Person", name: "Aoife", jobTitle: "Director", url: "https://fiu.test/talent/aoife" },
        { "@type": "Person", name: "Guest", jobTitle: "Sound" },
      ],
    });
    expect(crumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });

  it("falls back to CreativeWork without a Vimeo film", () => {
    const [work] = projectGraph({ ...base, vimeoUrl: null })["@graph"];
    expect(work).toMatchObject({ "@type": "CreativeWork", name: "Solas" });
    expect(work).not.toHaveProperty("embedUrl");
  });
});

describe("personGraph", () => {
  it("describes the person and points at the organisation", () => {
    const [person, crumbs] = personGraph({
      lang: "en",
      name: "Aoife",
      slug: "aoife",
      roles: ["Director", "Editor"],
      description: "Makes films.",
      imageUrl: "https://cdn.test/aoife.jpg",
      crumbs: { home: "Fiú Media", talent: "Talent" },
    })["@graph"];
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Aoife",
      url: "https://fiu.test/talent/aoife",
      jobTitle: "Director, Editor",
      description: "Makes films.",
      image: "https://cdn.test/aoife.jpg",
      worksFor: { "@id": organizationId() },
    });
    expect(crumbs).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: expect.arrayContaining([expect.objectContaining({ name: "Talent", item: "https://fiu.test/talent" })]),
    });
  });
});
