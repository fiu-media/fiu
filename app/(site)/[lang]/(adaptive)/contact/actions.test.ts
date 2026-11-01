import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  create: vi.fn(),
  sendEmail: vi.fn(),
  getRecipient: vi.fn(),
}));

vi.mock("botid/server", () => ({ checkBotId: mocks.checkBotId }));
vi.mock("@/sanity/lib/writeClient", () => ({ writeClient: { create: mocks.create } }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email/settings", () => ({ getRecipient: mocks.getRecipient }));

import { submitContact } from "./actions";

const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
const idle = { status: "idle" } as const;

const form = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    lang: "en",
    submissionId: SUBMISSION_ID,
    name: "Aoife",
    email: "aoife@example.com",
    enquiryType: "Talent",
    message: "Hello there",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.checkBotId.mockResolvedValue({ isBot: false });
  mocks.create.mockResolvedValue({});
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.getRecipient.mockResolvedValue("studio@example.com");
});

describe("submitContact", () => {
  it("stores the message and notifies the studio", async () => {
    expect(await submitContact(idle, form())).toEqual({ status: "success" });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      _id: `contactMessage-${SUBMISSION_ID}`,
      _type: "contactMessage",
      enquiryType: "Talent",
    });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({ to: "studio@example.com", replyTo: "aoife@example.com" });
  });

  it("rejects bots and a filled honeypot", async () => {
    mocks.checkBotId.mockResolvedValue({ isBot: true });
    expect(await submitContact(idle, form())).toMatchObject({ error: "rejected" });
    mocks.checkBotId.mockResolvedValue({ isBot: false });
    expect(await submitContact(idle, form({ website: "http://spam" }))).toMatchObject({ error: "rejected" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns field errors and keeps the entered values", async () => {
    const state = await submitContact(idle, form({ message: "", email: "nope" }));
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { message: "required", email: "invalid" },
      values: { name: "Aoife", enquiryType: "Talent" },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("treats a 409 (double submit) as success without emailing again", async () => {
    mocks.create.mockRejectedValue({ statusCode: 409 });
    expect(await submitContact(idle, form())).toEqual({ status: "success" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("reports failed when storing fails", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    expect(await submitContact(idle, form())).toMatchObject({
      status: "error",
      error: "failed",
      values: { message: "Hello there" },
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("skips the notification when no recipient is configured", async () => {
    mocks.getRecipient.mockResolvedValue(null);
    expect(await submitContact(idle, form())).toEqual({ status: "success" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
