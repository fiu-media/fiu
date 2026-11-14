import { describe, expect, it } from "vitest";

import { documentTypes, inboxTypes, singletonTypes, translatedTypes } from "./documentTypes";
import { schemaTypes } from "./index";

describe("documentTypes", () => {
  it("lists exactly the document types in the schema", () => {
    expect(schemaTypes.map(({ name }) => name).sort()).toEqual(Object.keys(documentTypes).sort());
  });

  it("derives the lists the Studio and tooling use", () => {
    expect(translatedTypes).toEqual(["siteSettings", "project", "talent", "projectType", "role", "rentalCategory", "rentalItem"]);
    expect(singletonTypes).toEqual(["siteSettings", "launchGate"]);
    expect(inboxTypes).toEqual(["quoteRequest", "contactMessage"]);
  });

  it("keeps site-written types out of translation", () => {
    expect(translatedTypes.filter((type) => inboxTypes.includes(type))).toEqual([]);
  });
});
