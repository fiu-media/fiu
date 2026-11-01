import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const run = (path: string) => proxy(new NextRequest(`https://fiu.test${path}`));

describe("proxy", () => {
  it("redirects the explicit default-locale URL to the unprefixed one", () => {
    const response = run("/en/about?x=1");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/about?x=1");
  });

  it("redirects /en to the root", () => {
    const response = run("/en");
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://fiu.test/");
  });

  it("rewrites unprefixed paths to the default locale without changing the URL", () => {
    const response = run("/about");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/about");
    expect(response.headers.get("location")).toBeNull();
  });

  it("rewrites the root to /en", () => {
    expect(run("/").headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en");
  });

  it("does not treat a path that merely starts with the locale code as prefixed", () => {
    expect(run("/english").headers.get("x-middleware-rewrite")).toBe("https://fiu.test/en/english");
  });
});
