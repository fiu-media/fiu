import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), env: {} as { RESEND_API_KEY?: string; RESEND_SEGMENT_ID?: string } }));
vi.mock("resend", () => ({
  Resend: class {
    contacts = { create: mocks.create };
  },
}));
vi.mock("@/env", () => ({ env: mocks.env }));

import { createContact, splitName } from "./contacts";

beforeEach(() => {
  mocks.env.RESEND_API_KEY = "re_test";
  mocks.env.RESEND_SEGMENT_ID = "seg_general";
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.create.mockResolvedValue({ data: { id: "c_1", object: "contact" }, error: null });
});
afterEach(() => {
  mocks.env.RESEND_API_KEY = undefined;
  mocks.env.RESEND_SEGMENT_ID = undefined;
  vi.clearAllMocks();
});

describe("splitName", () => {
  it("splits at the first space, keeping the rest as the last name", () => {
    expect(splitName("Aoife Ní Bhriain")).toEqual({ firstName: "Aoife", lastName: "Ní Bhriain" });
    expect(splitName("  Aoife   Murphy ")).toEqual({ firstName: "Aoife", lastName: "Murphy" });
  });

  it("leaves the last name out for a single word", () => {
    expect(splitName("Aoife")).toEqual({ firstName: "Aoife", lastName: undefined });
  });
});

describe("createContact", () => {
  it("adds an unsubscribed contact to the configured segment with the phone as a property", async () => {
    await createContact({ name: "Aoife Murphy", email: "aoife@example.com", phone: "+353871234567" });
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0]).toEqual({
      email: "aoife@example.com",
      firstName: "Aoife",
      lastName: "Murphy",
      unsubscribed: true,
      segments: [{ id: "seg_general" }],
      properties: { phone: "+353871234567" },
    });
  });

  it("adds no segment when RESEND_SEGMENT_ID is not set", async () => {
    mocks.env.RESEND_SEGMENT_ID = undefined;
    await createContact({ name: "Aoife", email: "aoife@example.com" });
    expect(mocks.create.mock.calls[0][0].segments).toBeUndefined();
  });

  it("leaves out the phone property when there is no phone", async () => {
    await createContact({ name: "Aoife", email: "aoife@example.com", phone: "" });
    expect(mocks.create.mock.calls[0][0].properties).toBeUndefined();
  });

  it("sends an internationalised domain as punycode", async () => {
    await createContact({ name: "Anna", email: "anna@exämple.de" });
    expect(mocks.create.mock.calls[0][0].email).toBe("anna@xn--exmple-cua.de");
  });

  it("skips an address Resend can't take", async () => {
    await createContact({ name: "Zoë", email: "zoë@example.com" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("skips without an API key", async () => {
    mocks.env.RESEND_API_KEY = undefined;
    await createContact({ name: "Aoife", email: "aoife@example.com" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("throws when Resend rejects the contact", async () => {
    mocks.create.mockResolvedValue({ data: null, error: { name: "validation_error", message: "Unknown property" } });
    await expect(createContact({ name: "Aoife", email: "aoife@example.com", phone: "+353871234567" })).rejects.toThrow(
      "validation_error: Unknown property",
    );
  });
});
