import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { plainTextOptions } from "./send";
import { en } from "@/lib/i18n/dictionaries/en";
import { contactNotification, quoteConfirmation, quoteNotification } from "./templates";

const hostile = `<script>alert("x")</script> & 'q'`;
const escaped = "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#x27;q&#x27;";

const quote = {
  lang: "en" as const,
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

const html = (email: { react: React.ReactElement }) => render(email.react);
const text = (email: { react: React.ReactElement }) => render(email.react, plainTextOptions);

describe("email templates", () => {
  it("escapes visitor input in the HTML of the quote notification", async () => {
    const out = await html(quoteNotification(en, quote, "https://studio.test/?a=1&b=2"));
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<b>Brand</b>");
    expect(out).toContain(escaped);
    expect(out).toContain("&lt;b&gt;Brand&lt;/b&gt;");
    expect(out).toContain('href="https://studio.test/?a=1&amp;b=2"');
  });

  it("keeps the plain-text version raw", async () => {
    const out = await text(quoteNotification(en, quote, "https://studio.test/"));
    expect(out).toContain(hostile);
    expect(out).toContain(`2 × <b>Brand</b> ${hostile}`);
    expect(out).toContain(en.emails.quoteNotify.heading);
  });

  it("shows the dates as a localised range with its length in both quote emails", async () => {
    const pattern = /1\s*–\s*3 Dec 2026 · 3 days/;
    expect(await text(quoteNotification(en, quote, "https://studio.test/"))).toMatch(pattern);
    expect(await html(quoteConfirmation(en, quote))).toMatch(pattern);
  });

  it("omits empty rows", async () => {
    const out = await text(quoteNotification(en, quote, "https://studio.test/"));
    expect(out).not.toContain(`${en.emails.labels.phone}`);
  });

  it("escapes the confirmation email", async () => {
    const out = await html(quoteConfirmation(en, quote));
    expect(out).not.toContain("<script>");
    expect(out).toContain(escaped);
  });

  it("escapes the contact notification", async () => {
    const email = contactNotification(
      en,
      { name: hostile, email: "a@example.com", enquiryType: "Talent", message: hostile },
      "https://studio.test/",
    );
    const out = await html(email);
    expect(out).not.toContain("<script>");
    expect(out).toContain(escaped);
    expect(email.subject).toContain("Talent");
  });
});
