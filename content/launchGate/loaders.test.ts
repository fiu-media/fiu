import { beforeEach, describe, expect, it, vi } from "vitest";

const fetch = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/client", () => ({ client: { fetch } }));

import { getLaunchAt, LAUNCH_AT_TTL_MS, resetLaunchAtCache, toLaunchAt } from "./loaders";

const t0 = 1_000_000;

beforeEach(() => {
  resetLaunchAtCache();
  fetch.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("toLaunchAt", () => {
  it("reads a datetime, and treats anything else as no date", () => {
    expect(toLaunchAt("2026-12-01T09:00:00.000Z")?.toISOString()).toBe("2026-12-01T09:00:00.000Z");
    expect(toLaunchAt(null)).toBeNull();
    expect(toLaunchAt("")).toBeNull();
    expect(toLaunchAt("soon")).toBeNull();
  });
});

describe("getLaunchAt", () => {
  it("is null while no launch document is published", async () => {
    fetch.mockResolvedValue(null);
    expect(await getLaunchAt(t0)).toBeNull();
  });

  it("reuses a read for the TTL, then reads again", async () => {
    fetch.mockResolvedValue("2026-12-01T09:00:00.000Z");
    await getLaunchAt(t0);
    await getLaunchAt(t0 + LAUNCH_AT_TTL_MS - 1);
    expect(fetch).toHaveBeenCalledTimes(1);

    fetch.mockResolvedValue("2026-12-02T09:00:00.000Z");
    expect((await getLaunchAt(t0 + LAUNCH_AT_TTL_MS))?.toISOString()).toBe("2026-12-02T09:00:00.000Z");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the last date when Sanity can't be reached, so a launched site doesn't close", async () => {
    fetch.mockResolvedValueOnce("2020-01-01T00:00:00.000Z");
    await getLaunchAt(t0);
    fetch.mockRejectedValue(new Error("down"));
    expect((await getLaunchAt(t0 + LAUNCH_AT_TTL_MS))?.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    // And it backs off rather than asking again straight away.
    await getLaunchAt(t0 + LAUNCH_AT_TTL_MS + 1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("stays closed when Sanity can't be reached and nothing is remembered", async () => {
    fetch.mockRejectedValue(new Error("down"));
    expect(await getLaunchAt(t0)).toBeNull();
  });
});
