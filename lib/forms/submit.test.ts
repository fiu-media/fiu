import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const checkBotId = vi.hoisted(() => vi.fn());
vi.mock("botid/server", () => ({ checkBotId }));

import { guardSubmission } from "./submit";

const schema = z.object({
  name: z.string({ error: "required" }).min(1, "required"),
  email: z.email("invalid"),
  website: z.string().default(""),
});

const form = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
};

beforeEach(() => {
  checkBotId.mockReset();
  checkBotId.mockResolvedValue({ isBot: false });
});

describe("guardSubmission", () => {
  it("returns parsed data for a valid human submission", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com" }));
    expect(result).toMatchObject({ ok: true, data: { name: "Aoife", email: "a@example.com", website: "" } });
  });

  it("rejects bots without validating, keeping the entered values", async () => {
    checkBotId.mockResolvedValue({ isBot: true });
    const result = await guardSubmission(schema, form({ name: "", email: "bad" }));
    expect(result).toMatchObject({
      ok: false,
      result: { error: { formErrors: ["rejected"] }, submission: { payload: { email: "bad" } } },
    });
  });

  it("rejects a filled honeypot and doesn't echo it back", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com", website: "http://spam" }));
    expect(result).toMatchObject({ ok: false, result: { error: { formErrors: ["rejected"] } } });
    expect((result as { result: { submission: { payload: object } } }).result.submission.payload).not.toHaveProperty("website");
  });

  it("treats a whitespace-only honeypot as empty", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com", website: "  " }));
    expect(result.ok).toBe(true);
  });

  it("maps validation issues to the error code per field, treating blanks as missing", async () => {
    const result = await guardSubmission(schema, form({ name: "", email: "bad" }));
    expect(result).toMatchObject({
      ok: false,
      result: { error: { fieldErrors: { name: ["required"], email: ["invalid"] } }, submission: { payload: { email: "bad" } } },
    });
  });

  it("turns a problem with a hidden field into a form-level rejection", async () => {
    const hidden = z.object({ lang: z.literal("en"), name: z.string({ error: "required" }) });
    const result = await guardSubmission(hidden, form({ lang: "fr", name: "Aoife" }));
    expect(result).toMatchObject({ ok: false, result: { error: { formErrors: ["rejected"], fieldErrors: {} } } });
  });

  it("lets a caller fail the submission with the submitted values", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com" }));
    if (!result.ok) throw new Error("expected a valid submission");
    expect(result.fail({ formErrors: ["failed"] })).toMatchObject({
      error: { formErrors: ["failed"] },
      submission: { payload: { name: "Aoife" } },
    });
    expect(result.succeed()).toMatchObject({ success: true, reset: true });
  });
});
