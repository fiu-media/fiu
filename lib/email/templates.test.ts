import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { contactNotification, quoteConfirmation, quoteNotification } from "./templates";

const hostile = `<script>alert("x")</script> & 'q'`;
const escaped = "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;";

const quote = {
  name: hostile,
  email: "a@example.com",
  phone: "",
  company: "",
  production: hostile,
  startDate: "2026-12-01",
  endDate: "2026-12-03",
  message: hostile,
  kit: [{ name: hostile, brand: "<b>Brand</b>", qty: 2 }],
};

describe("email templates", () => {
  it("escapes visitor input in the HTML of the quote notification", () => {
    const { html } = quoteNotification(en, quote, "https://studio.test/?a=1&b=2");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Brand</b>");
    expect(html).toContain(escaped);
    expect(html).toContain("&lt;b&gt;Brand&lt;/b&gt;");
    expect(html).toContain('href="https://studio.test/?a=1&amp;b=2"');
  });

  it("keeps the plain-text version raw", () => {
    const { text } = quoteNotification(en, quote, "https://studio.test/");
    expect(text).toContain(hostile);
    expect(text).toContain(`2 × <b>Brand</b> ${hostile}`);
  });

  it("omits empty rows", () => {
    const { text } = quoteNotification(en, quote, "https://studio.test/");
    expect(text).not.toContain(`${en.emails.labels.phone}:`);
  });

  it("escapes the confirmation email", () => {
    const { html } = quoteConfirmation(en, quote);
    expect(html).not.toContain("<script>");
    expect(html).toContain(escaped);
  });

  it("escapes the contact notification", () => {
    const { html, subject } = contactNotification(en, { name: hostile, email: "a@example.com", enquiryType: "Talent", message: hostile }, "https://studio.test/");
    expect(html).not.toContain("<script>");
    expect(html).toContain(escaped);
    expect(subject).toContain("Talent");
  });
});
