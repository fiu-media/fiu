import { describe, expect, it } from "vitest";
import { parseVimeo, vimeoEmbedUrl } from "./vimeo";

describe("parseVimeo", () => {
  it.each([
    ["https://vimeo.com/123456", { id: "123456", hash: undefined }],
    ["https://vimeo.com/123456/abcdef0123", { id: "123456", hash: "abcdef0123" }],
    ["https://vimeo.com/channels/staffpicks/123456", { id: "123456", hash: undefined }],
    ["https://player.vimeo.com/video/123456?h=abcdef0123", { id: "123456", hash: "abcdef0123" }],
    ["https://www.vimeo.com/123456", { id: "123456", hash: undefined }],
  ])("reads %s", (url, expected) => {
    expect(parseVimeo(url)).toEqual(expected);
  });

  it("ignores a trailing segment that is not a hash", () => {
    expect(parseVimeo("https://vimeo.com/123456/settings")).toEqual({ id: "123456", hash: undefined });
  });

  it.each([
    null,
    undefined,
    "",
    "not a url",
    "https://example.com/123456",
    "https://notvimeo.com/123456",
    "https://vimeo.com/about",
  ])("returns null for %s", (url) => {
    expect(parseVimeo(url)).toBeNull();
  });
});

describe("vimeoEmbedUrl", () => {
  it("always asks for do-not-track", () => {
    expect(vimeoEmbedUrl({ id: "1" })).toBe("https://player.vimeo.com/video/1?dnt=1");
  });

  it("adds the privacy hash", () => {
    expect(vimeoEmbedUrl({ id: "1", hash: "ab" })).toBe("https://player.vimeo.com/video/1?dnt=1&h=ab");
  });

  it("background wins over autoplay", () => {
    expect(vimeoEmbedUrl({ id: "1" }, { background: true, autoplay: true })).toBe(
      "https://player.vimeo.com/video/1?dnt=1&background=1",
    );
    expect(vimeoEmbedUrl({ id: "1" }, { autoplay: true })).toBe("https://player.vimeo.com/video/1?dnt=1&autoplay=1");
  });
});
