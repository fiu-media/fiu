import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  create: vi.fn(),
  sendEmail: vi.fn(),
  getRecipient: vi.fn(),
}));
vi.mock("botid/server", () => ({ checkBotId: mocks.checkBotId }));
vi.mock("@/sanity/lib/writeClient", () => ({ writeClient: { create: mocks.create } }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));

import { at } from "@/lib/at";
import { build } from "@/lib/email/templates";

import { guardSubmission, handleSubmission, noChecks } from "./submit";

const { checkBotId } = mocks;

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
    expect(result).toHaveProperty("result.submission.payload");
    expect(result).not.toHaveProperty("result.submission.payload.website");
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

describe("handleSubmission", () => {
  const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
  const messageSchema = z.object({
    lang: z.enum(["en", "ga"]),
    submissionId: z.uuid(),
    name: z.string({ error: "required" }).min(1, "required"),
    // Looser than the real schemas, so an accented address (which Resend can't deliver to) gets through.
    email: z.string().regex(/@/, "emailInvalid"),
    message: z.string().default(""),
  });
  const fields = { lang: "en", submissionId: SUBMISSION_ID, name: "Aoife", email: "aoife@example.com", message: "Hi" };
  const after = vi.fn();

  type Config = Parameters<typeof handleSubmission<typeof messageSchema, unknown>>[0];
  const run = (overrides: Record<string, string> = {}, config: Partial<Config> = {}) =>
    handleSubmission(
      {
        schema: messageSchema,
        docType: "contactMessage",
        recipient: "contact",
        getRecipient: mocks.getRecipient,
        validate: noChecks,
        toDocument: ({ name, email, message }) => ({ name, email, message }),
        emails: ({ data, dict, teamDict, studioLink }) => ({
          notification: build("contactNotification", teamDict, { ...data, phone: "", enquiryType: "Talent" }, { studioLink }),
          confirmation: build("contactConfirmation", dict, { ...data, phone: "", enquiryType: "Talent" }),
        }),
        after,
        ...config,
      },
      form({ ...fields, ...overrides }),
    );
  const sent = () => mocks.sendEmail.mock.calls.map(([email]) => email);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    checkBotId.mockResolvedValue({ isBot: false });
    mocks.create.mockResolvedValue({});
    mocks.sendEmail.mockResolvedValue(undefined);
    mocks.getRecipient.mockResolvedValue("studio@example.com");
    after.mockResolvedValue(undefined);
  });

  it("stores the document under an id from its type and the submission id", async () => {
    expect(await run()).toMatchObject({ success: true, confirmation: true });
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(at(mocks.create.mock.calls, 0)[0]).toMatchObject({
      _id: `contactMessage-${SUBMISSION_ID}`,
      _type: "contactMessage",
      status: "new",
      name: "Aoife",
      createdAt: expect.any(String),
    });
  });

  it("asks for the recipient of its kind, in the visitor's language", async () => {
    await run({ lang: "ga" });
    expect(mocks.getRecipient).toHaveBeenCalledWith("contact", "ga");
  });

  it("tells the studio, replying to the visitor, and confirms to the visitor, replying to the studio", async () => {
    await run();
    expect(sent()).toHaveLength(2);
    expect(sent()[0]).toMatchObject({ to: "studio@example.com", replyTo: "aoife@example.com" });
    expect(sent()[1]).toMatchObject({ to: "aoife@example.com", replyTo: "studio@example.com" });
  });

  it("writes the notification in the default language and links the stored document in Studio", async () => {
    await run({ lang: "ga" });
    const notification = sent()[0];
    expect(notification.subject).toBe("Our talent enquiry from Aoife");
    expect(JSON.stringify(notification.react.props)).toContain(`contactMessage-${SUBMISSION_ID}`);
  });

  it("runs the follow-up with the data once the document is stored", async () => {
    await run();
    expect(after).toHaveBeenCalledWith(expect.objectContaining({ name: "Aoife", email: "aoife@example.com" }));
  });

  it("stops at the first failed check, with its form errors and the entered values", async () => {
    const validate = vi.fn().mockResolvedValue({ formErrors: ["unavailable"] });
    expect(await run({}, { validate })).toMatchObject({
      error: { formErrors: ["unavailable"] },
      submission: { payload: { name: "Aoife" } },
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("hands what the check found to the document and the emails", async () => {
    const validate = vi.fn().mockResolvedValue({ extra: { note: "from validate" } });
    const toDocument = vi.fn().mockReturnValue({});
    const emails = vi.fn().mockReturnValue({
      notification: { subject: "n", react: null },
      confirmation: { subject: "c", react: null },
    });
    await run({}, { validate, toDocument, emails });
    expect(toDocument).toHaveBeenCalledWith(expect.anything(), { note: "from validate" });
    expect(emails).toHaveBeenCalledWith(expect.objectContaining({ extra: { note: "from validate" } }));
  });

  it("treats a 409 (double submit) as success without emailing or following up again", async () => {
    mocks.create.mockRejectedValue({ statusCode: 409 });
    expect(await run()).toMatchObject({ success: true });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("reports failed, keeping the entered values, when storing fails", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    expect(await run()).toMatchObject({
      error: { formErrors: ["failed"] },
      submission: { payload: { message: "Hi" } },
    });
    expect(console.error).toHaveBeenCalledWith("[contact] could not store submission:", expect.any(Error));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("skips the notification, but still confirms, when no recipient is set", async () => {
    mocks.getRecipient.mockResolvedValue(null);
    expect(await run()).toMatchObject({ success: true });
    expect(console.warn).toHaveBeenCalledWith("[contact] no recipient set in Site settings; skipping notification");
    expect(sent()).toHaveLength(1);
    expect(sent()[0]).toMatchObject({ to: "aoife@example.com" });
    expect(sent()[0].replyTo).toBeUndefined();
  });

  it("stores an address Resend can't deliver to, and says no confirmation will arrive", async () => {
    expect(await run({ email: "séan@example.ie" })).toMatchObject({ success: true, confirmation: false });
    expect(at(mocks.create.mock.calls, 0)[0]).toMatchObject({ email: "séan@example.ie" });
  });

  it("still succeeds when an email can't be sent", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("resend down"));
    expect(await run()).toMatchObject({ success: true });
    expect(after).toHaveBeenCalledOnce();
  });

  it("rejects bots and a filled honeypot before anything is stored or sent", async () => {
    checkBotId.mockResolvedValue({ isBot: true });
    expect(await run()).toMatchObject({ error: { formErrors: ["rejected"] } });
    checkBotId.mockResolvedValue({ isBot: false });
    expect(await run({ website: "http://spam" })).toMatchObject({ error: { formErrors: ["rejected"] } });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
  });

  it("returns the schema's errors without storing anything", async () => {
    expect(await run({ name: "", email: "nope" }, { validate: vi.fn() })).toMatchObject({
      error: { fieldErrors: { name: ["required"], email: ["emailInvalid"] } },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
