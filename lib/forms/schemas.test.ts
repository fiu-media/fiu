import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_HIRE_DAYS, MAX_LEAD_DAYS, contactSchema, isEnquiryType, limits, quoteSchema } from "./schemas";
import { toErrorCode } from "./state";

const common = { lang: "en", submissionId: "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c" };
const quote = {
  ...common,
  name: "  Aoife  ",
  email: "aoife@example.com",
  startDate: "2026-12-01",
  endDate: "2026-12-03",
  items: JSON.stringify([{ itemId: "item-1", qty: 2 }]),
};
const contact = { ...common, name: "Aoife", email: "aoife@example.com", enquiryType: "Talent", message: "Hello" };

type Result = { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } };
const issueCodes = (result: Result) => result.error?.issues.map((i) => `${String(i.path[0])}:${i.message}`) ?? [];
const daysFromToday = (days: number) => new Date(Date.UTC(2026, 10, 2 + days)).toISOString().slice(0, 10);

// The schema checks dates against today, so pin it (Dublin: 2 Nov 2026).
beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T12:00:00Z") }));
afterEach(() => vi.useRealTimers());

describe("quoteSchema", () => {
  it("accepts a valid request, trimming text and defaulting optional fields", () => {
    const result = quoteSchema.parse(quote);
    expect(result.name).toBe("Aoife");
    expect(result).toMatchObject({ phone: "", company: "", production: "", message: "", website: "" });
  });

  it("requires a name and a valid email", () => {
    const result = quoteSchema.safeParse({ ...quote, name: "   ", email: "nope" });
    expect(issueCodes(result)).toEqual(expect.arrayContaining(["name:required", "email:emailInvalid"]));
  });

  it("says required only for a missing value, and tooLong for an over-long one", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, name: undefined }))).toEqual(["name:required"]);
    for (const field of ["name", "company", "production", "message"] as const) {
      const result = quoteSchema.safeParse({ ...quote, [field]: "1".repeat(limits[field] + 1) });
      expect(issueCodes(result)).toContain(`${field}:tooLong`);
    }
  });

  it("accepts accented and internationalised addresses, composing them", () => {
    for (const email of ["séan@example.ie", "Seán.Ó.Súilleabháin@example.ie", "anna@exämple.de"]) {
      expect(quoteSchema.safeParse({ ...quote, email }).success, email).toBe(true);
    }
    // "e" followed by a combining acute accent arrives when a keyboard or paste decomposes the letter.
    expect(quoteSchema.parse({ ...quote, email: "se\u0301an@example.ie" }).email).toBe("s\u00e9an@example.ie");
  });

  it("trims the email, so a pasted trailing space is fine", () => {
    expect(quoteSchema.parse({ ...quote, email: "  aoife@example.com " }).email).toBe("aoife@example.com");
  });

  it("takes a phone number in international form, and lets it be left out", () => {
    for (const phone of ["+353871234567", "+442071838750", "+12133734253", undefined, ""]) {
      expect(quoteSchema.safeParse({ ...quote, phone }).success, String(phone)).toBe(true);
    }
    for (const phone of ["087 123 4567", "+353", "+3538712", "call me", "+1".padEnd(30, "2")]) {
      expect(issueCodes(quoteSchema.safeParse({ ...quote, phone })), phone).toEqual(["phone:phoneInvalid"]);
    }
  });

  it("stores a phone number in canonical form, dropping a trunk 0 typed after the dialling code", () => {
    expect(quoteSchema.parse({ ...quote, phone: "+3530871234567" }).phone).toBe("+353871234567");
    expect(quoteSchema.parse({ ...quote, phone: "+353871234567" }).phone).toBe("+353871234567");
    expect(quoteSchema.parse({ ...quote, phone: "" }).phone).toBe("");
  });

  it("rejects an end date before the start date", () => {
    const result = quoteSchema.safeParse({ ...quote, startDate: "2026-12-05", endDate: "2026-12-01" });
    expect(issueCodes(result)).toEqual(["endDate:beforeStart"]);
  });

  it("allows a single-day rental", () => {
    expect(quoteSchema.safeParse({ ...quote, endDate: quote.startDate }).success).toBe(true);
  });

  it("says required for a missing date and dateInvalid for one that isn't a date", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: undefined, endDate: undefined }))).toEqual([
      "startDate:required",
      "endDate:required",
    ]);
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: "01/12/2026" }))).toEqual(["startDate:dateInvalid"]);
  });

  it("doesn't add a range error on top of an impossible date", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: "2026-02-30" }))).toEqual(["startDate:dateInvalid"]);
    expect(issueCodes(quoteSchema.safeParse({ ...quote, endDate: "2026-12-32" }))).toEqual(["endDate:dateInvalid"]);
  });

  it("rejects a pick-up in the past but allows today", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: daysFromToday(-1), endDate: daysFromToday(1) }))).toEqual([
      "startDate:past",
    ]);
    expect(quoteSchema.safeParse({ ...quote, startDate: daysFromToday(0), endDate: daysFromToday(1) }).success).toBe(true);
  });

  it("caps how far ahead a pick-up can be and how long a hire can run", () => {
    const farthest = daysFromToday(MAX_LEAD_DAYS - 1);
    expect(quoteSchema.safeParse({ ...quote, startDate: farthest, endDate: farthest }).success).toBe(true);
    const tooFar = daysFromToday(MAX_LEAD_DAYS + 1);
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: tooFar, endDate: tooFar }))).toEqual(["startDate:tooFar"]);

    const start = daysFromToday(1);
    expect(quoteSchema.safeParse({ ...quote, startDate: start, endDate: daysFromToday(MAX_HIRE_DAYS) }).success).toBe(true);
    const tooLong = daysFromToday(MAX_HIRE_DAYS + 1);
    expect(issueCodes(quoteSchema.safeParse({ ...quote, startDate: start, endDate: tooLong }))).toEqual(["endDate:hireTooLong"]);
  });

  it("needs at least one item and caps the list and quantities", () => {
    expect(issueCodes(quoteSchema.safeParse({ ...quote, items: "[]" }))).toContain("items:empty");
    const many = Array.from({ length: 101 }, (_, i) => ({ itemId: `i${i}`, qty: 1 }));
    expect(quoteSchema.safeParse({ ...quote, items: JSON.stringify(many) }).success).toBe(false);
    for (const qty of [0, 100, 1.5]) {
      expect(quoteSchema.safeParse({ ...quote, items: JSON.stringify([{ itemId: "a", qty }]) }).success).toBe(false);
    }
  });

  it("reads the basket from the JSON in the hidden input", () => {
    expect(quoteSchema.parse(quote).items).toEqual([{ itemId: "item-1", qty: 2 }]);
    expect(issueCodes(quoteSchema.safeParse({ ...quote, items: undefined }))).toContain("items:empty");
    expect(issueCodes(quoteSchema.safeParse({ ...quote, items: "{not json" }))).toContain("items:invalid");
  });

  it("rejects an unknown locale and a non-uuid submission id", () => {
    expect(quoteSchema.safeParse({ ...quote, lang: "fr" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...quote, submissionId: "abc" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
  });

  it("takes any number of talent ids, one or none, as the form sends them", () => {
    expect(contactSchema.parse(contact).talent).toEqual([]);
    expect(contactSchema.parse({ ...contact, talent: ["a"] }).talent).toEqual(["a"]);
    expect(contactSchema.parse({ ...contact, talent: ["a", "b"] }).talent).toEqual(["a", "b"]);
    expect(contactSchema.safeParse({ ...contact, talent: Array.from({ length: 21 }, (_, i) => `t${i}`) }).success).toBe(false);
  });

  it("requires a message and a known enquiry type", () => {
    const result = contactSchema.safeParse({ ...contact, message: " ", enquiryType: "Spam" });
    expect(issueCodes(result)).toContain("message:required");
    expect(result.success).toBe(false);
  });

  it("says required for an empty email and emailInvalid for a malformed or over-long one", () => {
    expect(issueCodes(contactSchema.safeParse({ ...contact, email: undefined }))).toEqual(["email:required"]);
    for (const email of ["nope", "a@b", "a b@c.com", "x".repeat(limits.email) + "@example.com"]) {
      expect(issueCodes(contactSchema.safeParse({ ...contact, email }))).toHaveLength(1);
    }
    expect(issueCodes(contactSchema.safeParse({ ...contact, email: "nope" }))).toEqual(["email:emailInvalid"]);
    expect(issueCodes(contactSchema.safeParse({ ...contact, message: "x".repeat(limits.message + 1) }))).toEqual([
      "message:tooLong",
    ]);
  });
});

describe("error codes", () => {
  it("every visitor-facing issue the schemas can raise is a code we have copy for", () => {
    const inputs = [
      { schema: contactSchema, value: { lang: "en" } },
      { schema: contactSchema, value: { ...contact, email: "nope", name: "x".repeat(500), message: "x".repeat(5000) } },
      { schema: quoteSchema, value: { lang: "en" } },
      { schema: quoteSchema, value: { ...quote, phone: "abc", startDate: "x", endDate: "y", items: "oops" } },
      { schema: quoteSchema, value: { ...quote, startDate: daysFromToday(-5), endDate: daysFromToday(-9) } },
      { schema: quoteSchema, value: { ...quote, startDate: daysFromToday(900), endDate: daysFromToday(2000) } },
      { schema: quoteSchema, value: { ...quote, startDate: daysFromToday(1), endDate: daysFromToday(900) } },
    ];
    const hidden = ["lang", "submissionId", "website", "enquiryType"];
    for (const { schema, value } of inputs) {
      for (const issue of schema.safeParse(value).error?.issues ?? []) {
        if (hidden.includes(String(issue.path[0]))) continue;
        // toErrorCode falls back to "invalid"; a raw zod message must never reach it.
        expect(issue.message, `${String(issue.path[0])}: ${issue.message}`).toBe(toErrorCode(issue.message));
      }
    }
  });
});

describe("isEnquiryType", () => {
  it("only accepts the known types", () => {
    expect(isEnquiryType("Talent")).toBe(true);
    expect(isEnquiryType("talent")).toBe(false);
    expect(isEnquiryType(null)).toBe(false);
  });
});
