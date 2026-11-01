import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

import { sendEmail } from "./send";

const email = { to: "studio@example.com", subject: "Hello", react: createElement("p", null, "Body copy"), replyTo: "a@example.com" };

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.send.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("sendEmail", () => {
  it("sends the React element and a plain-text part", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    await sendEmail(email);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0]).toMatchObject({ to: "studio@example.com", subject: "Hello", replyTo: "a@example.com", react: email.react });
    expect(mocks.send.mock.calls[0][0].text).toContain("Body copy");
  });

  it("skips the send without RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await sendEmail(email);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("throws when Resend rejects the email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    mocks.send.mockResolvedValue({ error: { name: "validation_error", message: "bad" } });
    await expect(sendEmail(email)).rejects.toThrow("validation_error");
  });
});
