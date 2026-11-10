import { describe, expect, it } from "vitest";

import { studioUrl } from "../studio-env";
import { editAttr } from "./editing";

describe("editAttr", () => {
  it("points at the hosted Studio, not a route on the site", () => {
    const attr = editAttr("project", "abc", "title");
    expect(attr).toContain(`base=${encodeURIComponent(studioUrl)}`);
    expect(attr).not.toContain("/studio;");
  });

  it("names the document, its type and the field", () => {
    const attr = editAttr("talent", "abc", "portrait");
    expect(attr).toContain("id=abc");
    expect(attr).toContain("type=talent");
    expect(attr).toContain("path=portrait");
  });

  it("uses the published id for a draft", () => {
    expect(editAttr("siteSettings", "drafts.abc", "slogan")).toBe(editAttr("siteSettings", "abc", "slogan"));
  });
});
