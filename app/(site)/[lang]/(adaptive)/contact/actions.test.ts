import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  create: vi.fn(),
  sendEmail: vi.fn(),
  getRecipient: vi.fn(),
  createContact: vi.fn(),
}));

vi.mock("botid/server", () => ({ checkBotId: mocks.checkBotId }));
vi.mock("@/sanity/lib/writeClient", () => ({ writeClient: { create: mocks.create } }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email/contacts", () => ({ createContact: mocks.createContact }));
vi.mock("@/lib/email/settings", () => ({ getRecipient: mocks.getRecipient }));

import { getDictionary } from "@/lib/i18n/dictionaries";

import { submitContact } from "./actions";

const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
const idle = null;

const form = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    lang: "en",
    submissionId: SUBMISSION_ID,
    name: "Aoife",
    email: "aoife@example.com",
    phone: "+353871234567",
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
  mocks.createContact.mockResolvedValue(undefined);
});

describe("submitContact", () => {
  it("stores the message and notifies the studio", async () => {
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      _id: `contactMessage-${SUBMISSION_ID}`,
      _type: "contactMessage",
      enquiryType: "Talent",
      phone: "+353871234567",
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({ to: "studio@example.com", replyTo: "aoife@example.com" });
  });

  it("emails the visitor a confirmation in their language, not the studio's", async () => {
    const ga = await getDictionary("ga");
    expect(await submitContact(idle, form({ lang: "ga" }))).toMatchObject({ success: true, confirmation: true });
    const sent = mocks.sendEmail.mock.calls.map(([email]) => email);
    expect(sent).toContainEqual(expect.objectContaining({ to: "aoife@example.com", subject: ga.emails.contactConfirm.subject }));
    expect(sent.find((email) => email.to === "aoife@example.com")).toMatchObject({ replyTo: "studio@example.com" });
    expect(sent.find((email) => email.to === "studio@example.com").subject).toBe("Talent enquiry from Aoife");
  });

  it("flags that no confirmation can go to an address Resend can't deliver", async () => {
    expect(await submitContact(idle, form({ email: "seán@example.com" }))).toMatchObject({
      success: true,
      confirmation: false,
    });
  });

  it("still succeeds when the confirmation can't be sent", async () => {
    mocks.sendEmail.mockImplementation(async ({ to }: { to: string }) => {
      if (to === "aoife@example.com") throw new Error("nope");
    });
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.createContact).toHaveBeenCalledOnce();
  });

  it("adds the visitor to Resend contacts", async () => {
    await submitContact(idle, form());
    expect(mocks.createContact).toHaveBeenCalledWith({
      name: "Aoife",
      email: "aoife@example.com",
      phone: "+353871234567",
    });
  });

  it("stores no phone when none is given", async () => {
    await submitContact(idle, form({ phone: "" }));
    expect(mocks.create.mock.calls[0][0].phone).toBeUndefined();
  });

  it("still succeeds, and still emails, when the Resend contact can't be created", async () => {
    mocks.createContact.mockRejectedValue(new Error("nope"));
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
  });

  it("rejects bots and a filled honeypot", async () => {
    mocks.checkBotId.mockResolvedValue({ isBot: true });
    expect(await submitContact(idle, form())).toMatchObject({ error: { formErrors: ["rejected"] } });
    mocks.checkBotId.mockResolvedValue({ isBot: false });
    expect(await submitContact(idle, form({ website: "http://spam" }))).toMatchObject({
      error: { formErrors: ["rejected"] },
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.createContact).not.toHaveBeenCalled();
  });

  it("returns field errors and keeps the entered values", async () => {
    const state = await submitContact(idle, form({ message: "", email: "nope" }));
    expect(state).toMatchObject({
      error: { fieldErrors: { message: ["required"], email: ["emailInvalid"] } },
      submission: { payload: { name: "Aoife", enquiryType: "Talent" } },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("treats a 409 (double submit) as success without emailing again", async () => {
    mocks.create.mockRejectedValue({ statusCode: 409 });
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.createContact).not.toHaveBeenCalled();
  });

  it("reports failed when storing fails", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    expect(await submitContact(idle, form())).toMatchObject({
      error: { formErrors: ["failed"] },
      submission: { payload: { message: "Hello there" } },
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.createContact).not.toHaveBeenCalled();
  });

  it("skips the notification, but still confirms, when no recipient is configured", async () => {
    mocks.getRecipient.mockResolvedValue(null);
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({ to: "aoife@example.com" });
    expect(mocks.sendEmail.mock.calls[0][0].replyTo).toBeUndefined();
    expect(mocks.createContact).toHaveBeenCalledOnce();
  });
});
