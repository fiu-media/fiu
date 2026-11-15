import { describe, expect, it } from "vitest";

import { type SitemapContent, sitemapXml, toSitemap, toSplashSitemap } from "./sitemap";

const ORIGIN = "https://fiu.test";
const doc = (slug: string | null, language: string, _updatedAt = "2026-11-01T00:00:00Z") => ({ slug, language, _updatedAt });
const empty: SitemapContent = { projects: [], talent: [], rentals: null };
const urls = (content: SitemapContent) => toSitemap(content, ORIGIN).map((entry) => entry.url);

describe("toSitemap", () => {
  it("lists the fixed pages in every language, each naming its twins", () => {
    const sitemap = toSitemap(empty, ORIGIN);
    expect(sitemap.map((entry) => entry.url)).toEqual([
      "https://fiu.test",
      "https://fiu.test/ga",
      "https://fiu.test/about",
      "https://fiu.test/ga/about",
      "https://fiu.test/work",
      "https://fiu.test/ga/work",
      "https://fiu.test/talent",
      "https://fiu.test/ga/talent",
      "https://fiu.test/contact",
      "https://fiu.test/ga/contact",
      "https://fiu.test/privacy",
      "https://fiu.test/ga/privacy",
    ]);
    expect(sitemap[3]).toEqual({
      url: "https://fiu.test/ga/about",
      alternates: { languages: { en: "https://fiu.test/about", ga: "https://fiu.test/ga/about" } },
    });
  });

  it("gives a default-language document a page in every language, dated by its latest edit in any of them", () => {
    const sitemap = toSitemap(
      { ...empty, projects: [doc("solas", "en", "2026-11-01T00:00:00Z"), doc("solas", "ga", "2026-11-05T00:00:00Z")] },
      ORIGIN,
    );
    const pages = sitemap.filter((entry) => entry.url.includes("/work/"));
    expect(pages.map((entry) => entry.url)).toEqual(["https://fiu.test/work/solas", "https://fiu.test/ga/work/solas"]);
    expect(pages.map((entry) => entry.lastModified)).toEqual(["2026-11-05T00:00:00Z", "2026-11-05T00:00:00Z"]);
  });

  it("lists a document that only exists in a translation in that language alone", () => {
    const sitemap = toSitemap({ ...empty, talent: [doc("aoife", "en"), doc("niamh", "ga")] }, ORIGIN);
    const people = sitemap.filter((entry) => entry.url.includes("/talent/"));
    expect(people.map((entry) => entry.url)).toEqual([
      "https://fiu.test/talent/aoife",
      "https://fiu.test/ga/talent/aoife",
      "https://fiu.test/ga/talent/niamh",
    ]);
    expect(people[2]?.alternates).toEqual({ languages: { ga: "https://fiu.test/ga/talent/niamh" } });
  });

  it("skips a document without a slug", () => {
    expect(urls({ ...empty, projects: [doc(null, "en")] })).toHaveLength(12);
  });

  it("leaves Rentals out while it is hidden, and lists it with its items once it is on", () => {
    expect(urls(empty).some((url) => url.includes("/rentals"))).toBe(false);
    expect(urls({ ...empty, rentals: [doc("skypanel", "en")] }).filter((url) => url.includes("/rentals"))).toEqual([
      "https://fiu.test/rentals",
      "https://fiu.test/ga/rentals",
      "https://fiu.test/rentals/skypanel",
      "https://fiu.test/ga/rentals/skypanel",
    ]);
  });
});

describe("toSplashSitemap", () => {
  it("lists only the home page, in both languages, each naming its twin", () => {
    expect(toSplashSitemap(ORIGIN)).toEqual([
      { url: "https://fiu.test", alternates: { languages: { en: "https://fiu.test", ga: "https://fiu.test/ga" } } },
      { url: "https://fiu.test/ga", alternates: { languages: { en: "https://fiu.test", ga: "https://fiu.test/ga" } } },
    ]);
  });
});

describe("sitemapXml", () => {
  it("writes each entry with its language twins as xhtml alternates", () => {
    const xml = sitemapXml(toSplashSitemap(ORIGIN));
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    );
    expect(xml).toContain(
      '<url><loc>https://fiu.test/ga</loc><xhtml:link rel="alternate" hreflang="en" href="https://fiu.test" />'
        + '<xhtml:link rel="alternate" hreflang="ga" href="https://fiu.test/ga" /></url>',
    );
  });

  it("escapes characters that mean something in XML, and writes the date when there is one", () => {
    const xml = sitemapXml([{ url: "https://fiu.test/a?b=1&c=<2>", lastModified: "2026-11-01T00:00:00Z" }]);
    expect(xml).toContain("<loc>https://fiu.test/a?b=1&amp;c=&lt;2&gt;</loc>");
    expect(xml).toContain("<lastmod>2026-11-01T00:00:00Z</lastmod>");
  });
});
