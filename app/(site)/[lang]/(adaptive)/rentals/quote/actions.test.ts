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

import { submitQuote } from "./actions";

const SUBMISSION_ID = "3f1c2b4e-8a6d-4c1e-9b7a-0d5e6f7a8b9c";
const idle = { status: "idle" } as const;

const form = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    lang: "en",
    submissionId: SUBMISSION_ID,
    name: "Aoife",
    email: "aoife@example.com",
    startDate: "2999-01-01",
    endDate: "2999-01-03",
    items: JSON.stringify([{ itemId: "cam", qty: 2 }]),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
};

const camera = { _id: "cam", name: "Camera", brand: "Arri", maxQuantity: 5 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.checkBotId.mockResolvedValue({ isBot: false });
  mocks.fetch.mockResolvedValue([camera]);
  mocks.create.mockResolvedValue({});
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.getRecipient.mockResolvedValue("studio@example.com");
});

describe("submitQuote", () => {
  it("stores the request and emails the studio and the visitor", async () => {
    expect(await submitQuote(idle, form())).toEqual({ status: "success" });

    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      _id: `quoteRequest-${SUBMISSION_ID}`,
      _type: "quoteRequest",
      status: "new",
      email: "aoife@example.com",
      items: [{ _type: "line", item: { _type: "reference", _ref: "cam" }, qty: 2 }],
    });
    expect(mocks.sendEmail.mock.calls.map(([email]) => email.to).sort()).toEqual(["aoife@example.com", "studio@example.com"]);
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

  it("rejects bots without touching Sanity or email", async () => {
    mocks.checkBotId.mockResolvedValue({ isBot: true });
    expect(await submitQuote(idle, form())).toMatchObject({ status: "error", error: "rejected" });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const state = await submitQuote(idle, form({ email: "nope", name: "" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { email: "invalid", name: "required" } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("treats an unparsable basket as empty", async () => {
    const state = await submitQuote(idle, form({ items: "{not json" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { items: expect.any(String) } });
  });

  it("rejects a start date in the past", async () => {
    const state = await submitQuote(idle, form({ startDate: "2000-01-01", endDate: "2000-01-02" }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { startDate: "past" } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  describe("Dublin midnight", () => {
    afterEach(() => vi.useRealTimers());

    // 23:30 UTC on 30 Jun 2026 is 00:30 on 1 Jul in Dublin (IST, UTC+1).
    it("accepts a pick-up on Dublin's today and rejects Dublin's yesterday", async () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-06-30T23:30:00Z") });
      expect(await submitQuote(idle, form({ startDate: "2026-07-01", endDate: "2026-07-02" }))).toEqual({
        status: "success",
      });
      const state = await submitQuote(idle, form({ startDate: "2026-06-30", endDate: "2026-07-02" }));
      expect(state).toMatchObject({ status: "error", fieldErrors: { startDate: "past" } });
    });
  });

  it("reports unavailable when an item is missing or no longer available", async () => {
    mocks.fetch.mockResolvedValue([]);
    expect(await submitQuote(idle, form())).toMatchObject({ status: "error", error: "unavailable" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reports overLimit when a quantity exceeds the item's cap", async () => {
    mocks.fetch.mockResolvedValue([{ ...camera, maxQuantity: 1 }]);
    expect(await submitQuote(idle, form())).toMatchObject({ status: "error", error: "overLimit" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("falls back to a cap of 99 when the item has none", async () => {
    mocks.fetch.mockResolvedValue([{ ...camera, maxQuantity: null }]);
    expect(await submitQuote(idle, form({ items: JSON.stringify([{ itemId: "cam", qty: 99 }]) }))).toEqual({ status: "success" });
  });

  it("treats a 409 (double submit) as success without emailing again", async () => {
    mocks.create.mockRejectedValue({ statusCode: 409 });
    expect(await submitQuote(idle, form())).toEqual({ status: "success" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("reports failed when storing fails, keeping the entered values", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    expect(await submitQuote(idle, form())).toMatchObject({ status: "error", error: "failed", values: { name: "Aoife" } });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when email delivery fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("resend down"));
    expect(await submitQuote(idle, form())).toEqual({ status: "success" });
  });

  it("only emails the visitor when no studio recipient is configured", async () => {
    mocks.getRecipient.mockResolvedValue(null);
    await submitQuote(idle, form());
    expect(mocks.sendEmail.mock.calls.map(([email]) => email.to)).toEqual(["aoife@example.com"]);
  });
});
