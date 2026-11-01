import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), env: {} as { RESEND_API_KEY?: string; EMAIL_FROM?: string } }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
// `env` is parsed once at import, so tests swap the values on a mock instead of stubbing process.env.
vi.mock("@/env", () => ({ env: mocks.env }));

import { sendEmail } from "./send";

const email = {
  to: "studio@example.com",
  subject: "Hello",
  react: createElement("p", null, "Body copy"),
  replyTo: "a@example.com",
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.send.mockResolvedValue({ error: null });
});
afterEach(() => {
  mocks.env.RESEND_API_KEY = undefined;
  vi.clearAllMocks();
});

describe("sendEmail", () => {
  it("sends the React element and a plain-text part", async () => {
    mocks.env.RESEND_API_KEY = "re_test";
    await sendEmail(email);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      to: "studio@example.com",
      subject: "Hello",
      replyTo: "a@example.com",
      react: email.react,
    });
    expect(mocks.send.mock.calls[0][0].text).toContain("Body copy");
  });

  it("skips the send without RESEND_API_KEY", async () => {
    await sendEmail(email);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("throws when Resend rejects the email", async () => {
    mocks.env.RESEND_API_KEY = "re_test";
    mocks.send.mockResolvedValue({ error: { name: "validation_error", message: "bad" } });
    await expect(sendEmail(email)).rejects.toThrow("validation_error");
  });
});
