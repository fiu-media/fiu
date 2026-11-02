import { describe, expect, it } from "vitest";
import { en } from "./i18n/dictionaries/en";
import { describeRange, formatDateRange, isValidRange, rentalDays, todayInDublin } from "./dates";

describe("todayInDublin", () => {
  it("is already tomorrow just before midnight UTC in summer (IST, UTC+1)", () => {
    expect(todayInDublin(new Date("2026-06-30T22:59:59Z"))).toBe("2026-06-30");
    expect(todayInDublin(new Date("2026-06-30T23:00:00Z"))).toBe("2026-07-01");
  });

  it("matches UTC in winter (GMT)", () => {
    expect(todayInDublin(new Date("2026-12-01T23:30:00Z"))).toBe("2026-12-01");
    expect(todayInDublin(new Date("2026-12-02T00:00:00Z"))).toBe("2026-12-02");
  });

  it("switches offset at the spring transition (29 Mar 2026, 01:00 UTC)", () => {
    expect(todayInDublin(new Date("2026-03-28T23:30:00Z"))).toBe("2026-03-28");
    expect(todayInDublin(new Date("2026-03-29T00:30:00Z"))).toBe("2026-03-29");
    expect(todayInDublin(new Date("2026-03-29T23:30:00Z"))).toBe("2026-03-30");
  });

  it("switches offset at the autumn transition (25 Oct 2026, 01:00 UTC)", () => {
    expect(todayInDublin(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(todayInDublin(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-25");
    expect(todayInDublin(new Date("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
  });
});

describe("rentalDays", () => {
  it("counts both the first and last day", () => {
    expect(rentalDays("2026-12-01", "2026-12-03")).toBe(3);
    expect(rentalDays("2026-12-01", "2026-12-01")).toBe(1);
  });

  it("counts across months, years and DST changes", () => {
    expect(rentalDays("2026-11-30", "2026-12-02")).toBe(3);
    expect(rentalDays("2026-12-30", "2027-01-02")).toBe(4);
    expect(rentalDays("2026-03-28", "2026-03-30")).toBe(3);
    expect(rentalDays("2026-10-24", "2026-10-26")).toBe(3);
  });

  it("is 0 for anything that isn't a date", () => {
    expect(rentalDays("", "2026-12-01")).toBe(0);
    expect(rentalDays("2026-02-30", "2026-03-02")).toBe(0);
  });
});

describe("isValidRange", () => {
  it("accepts equal and increasing dates", () => {
    expect(isValidRange("2026-12-01", "2026-12-01")).toBe(true);
    expect(isValidRange("2026-12-01", "2027-01-01")).toBe(true);
  });

  it("rejects a reversed range and non-dates", () => {
    expect(isValidRange("2026-12-05", "2026-12-01")).toBe(false);
    expect(isValidRange("", "")).toBe(false);
    expect(isValidRange("2026-13-01", "2026-13-02")).toBe(false);
  });
});

describe("formatDateRange", () => {
  const range = (a: string, b: string) => formatDateRange(a, b, "en-IE").replace(/\s/g, " ");

  it("collapses the shared month and year", () => {
    expect(range("2026-11-03", "2026-11-05")).toBe("3–5 Nov 2026");
  });

  it("spells out both months across a month boundary", () => {
    expect(range("2026-11-30", "2026-12-02")).toBe("30 Nov – 2 Dec 2026");
  });

  it("spells out both years across a year boundary", () => {
    expect(range("2026-12-30", "2027-01-02")).toBe("30 Dec 2026 – 2 Jan 2027");
  });

  it("shows a single date for one day", () => {
    expect(range("2026-11-03", "2026-11-03")).toBe("3 Nov 2026");
  });

  it("falls back to the raw values for non-dates", () => {
    expect(formatDateRange("x", "y", "en-IE")).toBe("x – y");
  });
});

describe("describeRange", () => {
  it("adds the length, singular for one day", () => {
    expect(describeRange(en.dates, "en", "2026-11-03", "2026-11-05").replace(/\s/g, " ")).toBe("3–5 Nov 2026 · 3 days");
    expect(describeRange(en.dates, "en", "2026-11-03", "2026-11-03")).toBe("3 Nov 2026 · 1 day");
  });
});
