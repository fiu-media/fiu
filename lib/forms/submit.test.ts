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
      result: { status: "error", error: { "": ["rejected"] }, initialValue: { email: "bad" } },
    });
  });

  it("rejects a filled honeypot and doesn't echo it back", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com", website: "http://spam" }));
    expect(result).toMatchObject({ ok: false, result: { error: { "": ["rejected"] } } });
    expect((result as { result: { initialValue: object } }).result.initialValue).not.toHaveProperty("website");
  });

  it("treats a whitespace-only honeypot as empty", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com", website: "  " }));
    expect(result.ok).toBe(true);
  });

  it("maps validation issues to the error code per field, treating blanks as missing", async () => {
    const result = await guardSubmission(schema, form({ name: "", email: "bad" }));
    expect(result).toMatchObject({
      ok: false,
      result: { status: "error", error: { name: ["required"], email: ["invalid"] }, initialValue: { email: "bad" } },
    });
  });

  it("lets a caller reply with the submitted values", async () => {
    const result = await guardSubmission(schema, form({ name: "Aoife", email: "a@example.com" }));
    if (!result.ok) throw new Error("expected a valid submission");
    expect(result.reply({ formErrors: ["failed"] })).toMatchObject({
      status: "error",
      error: { "": ["failed"] },
      initialValue: { name: "Aoife" },
    });
  });
});
