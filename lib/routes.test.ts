import { describe, expect, it } from "vitest";

import { href, pageMetadata, routes } from "./routes";

describe("routes", () => {
  it("names every page", () => {
    expect(routes.home()).toBe("/");
    expect(routes.about()).toBe("/about");
    expect(routes.work()).toBe("/work");
    expect(routes.project("spring-shoot")).toBe("/work/spring-shoot");
    expect(routes.talent()).toBe("/talent");
    expect(routes.person("aoife")).toBe("/talent/aoife");
    expect(routes.rentals()).toBe("/rentals");
    expect(routes.rentalItem("arri-skypanel-s60-c")).toBe("/rentals/arri-skypanel-s60-c");
    expect(routes.quote()).toBe("/rentals/quote");
    expect(routes.contact()).toBe("/contact");
    expect(routes.privacy()).toBe("/privacy");
  });
});

describe("href", () => {
  it("leaves the default locale unprefixed", () => {
    expect(href("en", routes.home())).toBe("/");
    expect(href("en", routes.project("a"))).toBe("/work/a");
  });

  it("prefixes other locales", () => {
    expect(href("ga", routes.home())).toBe("/ga");
    expect(href("ga", routes.person("aoife"))).toBe("/ga/talent/aoife");
  });
});

describe("pageMetadata", () => {
  it("keeps the page's own metadata and adds the language alternates", () => {
    const meta = pageMetadata("ga", routes.contact(), { title: "Contact" });
    expect(meta.title).toBe("Contact");
    expect(meta.alternates).toEqual({
      canonical: "/ga/contact",
      languages: { en: "/contact", ga: "/ga/contact", "x-default": "/contact" },
    });
  });
});
