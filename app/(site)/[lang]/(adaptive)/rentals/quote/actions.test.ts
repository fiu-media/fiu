import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { MAX_QTY } from "@/features/rentals/basket/quantity";

import { submitQuote } from "./actions";

const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
const idle = null;

const form = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    lang: "en",
    submissionId: SUBMISSION_ID,
    name: "Aoife",
    email: "aoife@example.com",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    items: JSON.stringify([{ itemId: "cam", qty: 2 }]),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
};

const camera = { _id: "cam", name: "Camera", brand: "Arri", maxQuantity: 5 };

beforeEach(() => {
  vi.resetAllMocks();
  // Dates are checked against today, so pin it.
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-06-01T12:00:00Z") });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.checkBotId.mockResolvedValue({ isBot: false });
  mocks.fetch.mockResolvedValue([camera]);
  mocks.create.mockResolvedValue({});
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.getRecipient.mockResolvedValue("studio@example.com");
});

afterEach(() => vi.useRealTimers());

describe("submitQuote", () => {
  it("stores the request and emails the studio and the visitor", async () => {
    expect(await submitQuote(idle, form())).toMatchObject({ success: true });

    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      _id: `quoteRequest-${SUBMISSION_ID}`,
      _type: "quoteRequest",
      status: "new",
      email: "aoife@example.com",
      items: [{ _type: "line", item: { _type: "reference", _ref: "cam" }, qty: 2 }],
    });
    expect(mocks.sendEmail.mock.calls.map(([email]) => email.to).sort()).toEqual(["aoife@example.com", "studio@example.com"]);
    const sent = mocks.sendEmail.mock.calls.map(([email]) => email);
    expect(sent.find((email) => email.to === "aoife@example.com")).toMatchObject({ replyTo: "studio@example.com" });
  });

  it("merges duplicate basket lines before checking availability", async () => {
    await submitQuote(
      idle,
      form({
        items: JSON.stringify([
          { itemId: "cam", qty: 2 },
          { itemId: "cam", qty: 1 },
        ]),
      }),
    );
    expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ ids: ["cam"] });
    expect(mocks.create.mock.calls[0][0].items).toMatchObject([{ qty: 3 }]);
  });

  it("returns field errors for invalid input", async () => {
    const state = await submitQuote(idle, form({ email: "nope", name: "" }));
    expect(state).toMatchObject({
      error: { fieldErrors: { email: ["emailInvalid"], name: ["required"] } },
      submission: { payload: { email: "nope" } },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("treats an unparsable basket as invalid", async () => {
    const state = await submitQuote(idle, form({ items: "{not json" }));
    expect(state).toMatchObject({ error: { fieldErrors: { items: ["invalid"] } } });
  });

  it("treats a missing basket as empty", async () => {
    const formData = form();
    formData.delete("items");
    expect(await submitQuote(idle, formData)).toMatchObject({ error: { fieldErrors: { items: ["empty"] } } });
  });

  it("rejects a start date in the past", async () => {
    const state = await submitQuote(idle, form({ startDate: "2000-01-01", endDate: "2000-01-02" }));
    expect(state).toMatchObject({ error: { fieldErrors: { startDate: ["past"] } }, submission: { payload: { name: "Aoife" } } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  describe("Dublin midnight", () => {
    afterEach(() => vi.useRealTimers());

    // 23:30 UTC on 30 Jun 2026 is 00:30 on 1 Jul in Dublin (IST, UTC+1).
    it("accepts a pick-up on Dublin's today and rejects Dublin's yesterday", async () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-06-30T23:30:00Z") });
      expect(await submitQuote(idle, form({ startDate: "2026-07-01", endDate: "2026-07-02" }))).toMatchObject({
        success: true,
      });
      const state = await submitQuote(idle, form({ startDate: "2026-06-30", endDate: "2026-07-02" }));
      expect(state).toMatchObject({ error: { fieldErrors: { startDate: ["past"] } } });
    });
  });

  it("reports unavailable when an item is missing or no longer available", async () => {
    mocks.fetch.mockResolvedValue([]);
    expect(await submitQuote(idle, form())).toMatchObject({ error: { formErrors: ["unavailable"] } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reports overLimit when a quantity exceeds the item's cap", async () => {
    mocks.fetch.mockResolvedValue([{ ...camera, maxQuantity: 1 }]);
    expect(await submitQuote(idle, form())).toMatchObject({ error: { formErrors: ["overLimit"] } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("falls back to MAX_QTY when the item has none", async () => {
    mocks.fetch.mockResolvedValue([{ ...camera, maxQuantity: null }]);
    expect(await submitQuote(idle, form({ items: JSON.stringify([{ itemId: "cam", qty: MAX_QTY }]) }))).toMatchObject({
      success: true,
    });
  });

  it("stores an accented address but can only email the studio, and says so", async () => {
    const state = await submitQuote(idle, form({ email: "séan@example.ie" }));
    expect(state).toMatchObject({ success: true, confirmation: false });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ email: "séan@example.ie" });
    expect(mocks.sendEmail.mock.calls.map(([email]) => email.to)).toEqual(["studio@example.com", "séan@example.ie"]);
  });
});
