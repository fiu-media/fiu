import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const checkBotId = vi.hoisted(() => vi.fn());
vi.mock("botid/server", () => ({ checkBotId }));

import { formDataToRecord, guardSubmission } from "./submit";

const schema = z.object({
  name: z.string().min(1, "required"),
  email: z.email("invalid"),
  website: z.string().default(""),
});

beforeEach(() => {
  checkBotId.mockReset();
  checkBotId.mockResolvedValue({ isBot: false });
});

describe("guardSubmission", () => {
  it("returns parsed data for a valid human submission", async () => {
    const result = await guardSubmission(schema, { name: "Aoife", email: "a@example.com" });
    expect(result).toEqual({ ok: true, data: { name: "Aoife", email: "a@example.com", website: "" } });
  });

  it("rejects bots without validating, keeping text values", async () => {
    checkBotId.mockResolvedValue({ isBot: true });
    const result = await guardSubmission(schema, { name: "", email: "bad", website: "" });
    expect(result).toEqual({ ok: false, state: { status: "error", error: "rejected", values: { name: "", email: "bad" } } });
  });

  it("rejects a filled honeypot", async () => {
    const result = await guardSubmission(schema, { name: "Aoife", email: "a@example.com", website: "http://spam" });
    expect(result).toMatchObject({ ok: false, state: { error: "rejected" } });
  });

  it("treats a whitespace-only honeypot as empty", async () => {
    const result = await guardSubmission(schema, { name: "Aoife", email: "a@example.com", website: "  " });
    expect(result.ok).toBe(true);
  });

  it("maps validation issues to the first error code per field", async () => {
    const result = await guardSubmission(schema, { name: "", email: "bad" });
    expect(result).toEqual({
      ok: false,
      state: {
        status: "error",
        fieldErrors: { name: "required", email: "invalid" },
        error: undefined,
        values: { name: "", email: "bad" },
      },
    });
  });

  it("falls back to a generic error when no field is to blame", async () => {
    const result = await guardSubmission(
      z.object({ items: z.array(z.string()) }).strict(),
      "oops" as unknown as Record<string, unknown>,
    );
    expect(result).toMatchObject({ ok: false, state: { error: "invalid" } });
  });

  it("leaves honeypot, submission id and locale out of the returned values", async () => {
    checkBotId.mockResolvedValue({ isBot: true });
    const result = await guardSubmission(schema, { name: "A", website: "x", submissionId: "id", lang: "en" });
    expect(result).toMatchObject({ ok: false, state: { values: { name: "A" } } });
    expect((result as { state: { values: object } }).state.values).not.toHaveProperty("website");
    expect((result as { state: { values: object } }).state.values).not.toHaveProperty("submissionId");
    expect((result as { state: { values: object } }).state.values).not.toHaveProperty("lang");
  });
});

describe("formDataToRecord", () => {
  it("keeps text fields and skips files and React's $ACTION plumbing", () => {
    const formData = new FormData();
    formData.set("name", "Aoife");
    formData.set("$ACTION_ID_abc", "x");
    formData.set("file", new Blob(["x"]), "x.txt");
    expect(formDataToRecord(formData)).toEqual({ name: "Aoife" });
  });
});
