import { describe, expect, it } from "vitest";
import { contactSchema, isEnquiryType, quoteSchema } from "./schemas";

const common = { lang: "en", submissionId: "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c" };
const quote = {
  ...common,
  name: "  Aoife  ",
  email: "aoife@example.com",
  startDate: "2026-12-01",
  endDate: "2026-12-03",
  items: [{ itemId: "item-1", qty: 2 }],
};
const issueCodes = (result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((i) => `${String(i.path[0])}:${i.message}`) ?? [];

describe("quoteSchema", () => {
  it("accepts a valid request, trimming text and defaulting optional fields", () => {
    const result = quoteSchema.parse(quote);
    expect(result.name).toBe("Aoife");
    expect(result).toMatchObject({ phone: "", company: "", production: "", message: "", website: "" });
  });

  it("requires a name and a valid email", () => {
    const result = quoteSchema.safeParse({ ...quote, name: "   ", email: "nope" });
    expect(issueCodes(result)).toEqual(expect.arrayContaining(["name:required", "email:invalid"]));
  });

  it("rejects an end date before the start date", () => {
    const result = quoteSchema.safeParse({ ...quote, startDate: "2026-12-05", endDate: "2026-12-01" });
    expect(issueCodes(result)).toEqual(["endDate:beforeStart"]);
  });

  it("allows a single-day rental", () => {
    expect(quoteSchema.safeParse({ ...quote, endDate: quote.startDate }).success).toBe(true);
  });

  it("rejects malformed dates", () => {
    const result = quoteSchema.safeParse({ ...quote, startDate: "01/12/2026" });
    expect(issueCodes(result)).toContain("startDate:invalid");
  });

  it("needs at least one item and caps the list and quantities", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, items: [] }))).toContain("items:empty");
    const many = Array.from({ length: 101 }, (_, i) => ({ itemId: `i${i}`, qty: 1 }));
    expect(quoteSchema.safeParse({ ...quote, items: many }).success).toBe(false);
    for (const qty of [0, 100, 1.5]) {
      expect(quoteSchema.safeParse({ ...quote, items: [{ itemId: "a", qty }] }).success).toBe(false);
    }
  });

  it("rejects an unknown locale and a non-uuid submission id", () => {
    expect(quoteSchema.safeParse({ ...quote, lang: "fr" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, submissionId: "abc" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const contact = { ...common, name: "Aoife", email: "aoife@example.com", enquiryType: "Talent", message: "Hello" };

  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
  });

  it("requires a message and a known enquiry type", () => {
    const result = contactSchema.safeParse({ ...contact, message: " ", enquiryType: "Spam" });
    expect(issueCodes(result)).toContain("message:required");
    expect(result.success).toBe(false);
  });
});

describe("isEnquiryType", () => {
  it("only accepts the known types", () => {
    expect(isEnquiryType("Talent")).toBe(true);
    expect(isEnquiryType("talent")).toBe(false);
    expect(isEnquiryType(null)).toBe(false);
  });
});
