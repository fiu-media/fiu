import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
  fetch: vi.fn(),
  create: vi.fn(),
  sendEmail: vi.fn(),
  getRecipient: vi.fn(),
}));

vi.mock("botid/server", () => ({ checkBotId: mocks.checkBotId }));
vi.mock("@/sanity/lib/writeClient", () => ({ writeClient: { fetch: mocks.fetch, create: mocks.create } }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/email/settings", () => ({ getRecipient: mocks.getRecipient }));

import { submitContact } from "./actions";

const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
const idle = null;

const form = (overrides: Record<string, string> = {}, talent: string[] = []) => {
  const formData = new FormData();
  for (const id of talent) formData.append("talent", id);
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
  mocks.fetch.mockResolvedValue([]);
  mocks.create.mockResolvedValue({});
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.getRecipient.mockResolvedValue("studio@example.com");
});

describe("submitContact", () => {
  it("stores the message and notifies the studio", async () => {
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      _id: `contactMessage-${SUBMISSION_ID}`,
      _type: "contactMessage",
      enquiryType: "Talent",
    });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail.mock.calls[0][0]).toMatchObject({ to: "studio@example.com", replyTo: "aoife@example.com" });
  });

  describe("talent", () => {
    const aoife = { _id: "talent-aoife", name: "Aoife Ní Bhriain" };
    const sean = { _id: "talent-sean", name: "Seán Ó Súilleabháin" };

    it("stores the people asked about as references, and names them to the studio", async () => {
      mocks.fetch.mockResolvedValue([sean, aoife]);
      expect(await submitContact(idle, form({}, ["talent-aoife", "talent-sean"]))).toMatchObject({ success: true });
      expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ ids: ["talent-aoife", "talent-sean"] });
      expect(mocks.create.mock.calls[0][0].talent).toMatchObject([
        { _type: "reference", _ref: "talent-aoife" },
        { _type: "reference", _ref: "talent-sean" },
      ]);
      expect(mocks.sendEmail.mock.calls[0][0].react.props.data.talent).toEqual(["Aoife Ní Bhriain", "Seán Ó Súilleabháin"]);
    });

    it("counts a person once however many times they are sent", async () => {
      mocks.fetch.mockResolvedValue([aoife]);
      await submitContact(idle, form({}, ["talent-aoife", "talent-aoife"]));
      expect(mocks.create.mock.calls[0][0].talent).toHaveLength(1);
    });

    it("rejects someone who isn't on the roster", async () => {
      mocks.fetch.mockResolvedValue([aoife]);
      const state = await submitContact(idle, form({}, ["talent-aoife", "talent-nobody"]));
      expect(state).toMatchObject({ error: { fieldErrors: { talent: ["invalid"] } } });
      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("asks nothing and stores nothing when nobody was picked", async () => {
      await submitContact(idle, form());
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.create.mock.calls[0][0].talent).toEqual([]);
    });

    it("ignores talent on an enquiry that isn't about talent", async () => {
      await submitContact(idle, form({ enquiryType: "Rentals" }, ["talent-aoife"]));
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks.create.mock.calls[0][0].talent).toEqual([]);
    });
  });

  it("rejects bots and a filled honeypot", async () => {
    mocks.checkBotId.mockResolvedValue({ isBot: true });
    expect(await submitContact(idle, form())).toMatchObject({ error: { formErrors: ["rejected"] } });
    mocks.checkBotId.mockResolvedValue({ isBot: false });
    expect(await submitContact(idle, form({ website: "http://spam" }))).toMatchObject({
      error: { formErrors: ["rejected"] },
    });
    expect(mocks.create).not.toHaveBeenCalled();
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
  });

  it("reports failed when storing fails", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    expect(await submitContact(idle, form())).toMatchObject({
      error: { formErrors: ["failed"] },
      submission: { payload: { message: "Hello there" } },
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("skips the notification when no recipient is configured", async () => {
    mocks.getRecipient.mockResolvedValue(null);
    expect(await submitContact(idle, form())).toMatchObject({ success: true });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
