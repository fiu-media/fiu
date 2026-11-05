import { describe, expect, it } from "vitest";
import { LOGO_PARAM_PRESETS } from "./logoConfig";
import {
  applyLogoTier,
  higherTier,
  isTooSlowFresh,
  lowerTier,
  medianFps,
  PROBE_FRAMES,
  probeComplete,
  probeVerdict,
  STORED_TTL_MS,
  tierFromDevice,
  tooSlowSchema,
  type DeviceInfo,
} from "./logoTier";

const desktop: DeviceInfo = {
  webgl2: true,
  performanceCaveat: false,
  renderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)",
  deviceMemory: 8,
  cores: 10,
  saveData: false,
};

const frames = (ms: number, count = 12) => Array.from({ length: count }, () => ms);

describe("tierFromDevice", () => {
  it("gives a capable device the full glass", () => {
    expect(tierFromDevice(desktop)).toBe("high");
  });

  it("gives Safari, which reports neither memory nor cores, the full glass", () => {
    expect(tierFromDevice({ ...desktop, deviceMemory: undefined, cores: undefined })).toBe("high");
  });

  it.each([
    ["no WebGL2", { webgl2: false }],
    ["a software-rendering caveat", { performanceCaveat: true }],
    ["SwiftShader", { renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)" }],
    ["llvmpipe", { renderer: "llvmpipe (LLVM 15.0.7, 256 bits)" }],
    ["under 2 GB of memory", { deviceMemory: 1 }],
  ])("falls back to the SVG with %s", (_, info) => {
    expect(tierFromDevice({ ...desktop, ...info })).toBe("static");
  });

  it.each([
    ["2 GB of memory", { deviceMemory: 2 }],
    ["2 cores", { cores: 2 }],
    ["Save-Data", { saveData: true }],
  ])("starts at the low tier with %s", (_, info) => {
    expect(tierFromDevice({ ...desktop, ...info })).toBe("low");
  });

  it.each([
    ["4 GB of memory", { deviceMemory: 4 }],
    ["4 cores", { cores: 4 }],
  ])("starts at the medium tier with %s", (_, info) => {
    expect(tierFromDevice({ ...desktop, ...info })).toBe("medium");
  });
});

describe("probeVerdict", () => {
  it("keeps a smooth tier", () => {
    expect(probeVerdict(frames(16.7), "high")).toEqual({ next: "high", reprobe: false });
  });

  it("drops one tier between the floor and smooth", () => {
    expect(probeVerdict(frames(30), "high")).toEqual({ next: "medium", reprobe: false });
    expect(probeVerdict(frames(30), "low")).toEqual({ next: "low", reprobe: false });
  });

  it("jumps to low and probes again below the floor", () => {
    expect(probeVerdict(frames(60), "high")).toEqual({ next: "low", reprobe: true });
  });

  it("gives up on the glass when low is below the floor", () => {
    expect(probeVerdict(frames(60), "low")).toEqual({ next: "static", reprobe: false });
  });

  it("ignores a couple of hitches", () => {
    expect(probeVerdict([...frames(16.7, 10), 400, 250], "high").next).toBe("high");
  });
});

describe("probeComplete", () => {
  it("waits for every probe frame on a device near the floor", () => {
    expect(probeComplete(frames(30, PROBE_FRAMES - 1))).toBe(false);
    expect(probeComplete(frames(30, PROBE_FRAMES))).toBe(true);
  });

  it("stops early once a slow device has spent the budget", () => {
    expect(probeComplete(frames(300, 5))).toBe(true);
  });

  it("never judges on a frame or two, however slow (a late shader compile)", () => {
    expect(probeComplete([4000, 2000])).toBe(false);
  });
});

describe("medianFps", () => {
  it("averages the middle pair of an even count", () => {
    expect(medianFps([10, 20, 30, 40])).toBe(40);
  });
});

describe("tier steps", () => {
  it("steps down to low and no further", () => {
    expect(lowerTier("high")).toBe("medium");
    expect(lowerTier("low")).toBeNull();
  });

  it("steps up no higher than the ceiling", () => {
    expect(higherTier("low", "high")).toBe("medium");
    expect(higherTier("medium", "medium")).toBeNull();
    expect(higherTier("high", "high")).toBeNull();
  });
});

describe("applyLogoTier", () => {
  const light = LOGO_PARAM_PRESETS.light;

  it("leaves the preset alone at high", () => {
    expect(applyLogoTier(light, "high")).toBe(light);
  });

  it("trims samples at medium and keeps the rest", () => {
    expect(applyLogoTier(light, "medium")).toMatchObject({
      samples: 12,
      chromaticAberration: light.chromaticAberration,
      backside: light.backside,
    });
  });

  it("drops chromatic aberration and the backside pass at low", () => {
    expect(applyLogoTier(light, "low")).toMatchObject({ samples: 6, chromaticAberration: 0, backside: false });
  });

  it("never raises a preset's samples", () => {
    expect(applyLogoTier(LOGO_PARAM_PRESETS.dark, "medium").samples).toBe(LOGO_PARAM_PRESETS.dark.samples);
  });
});

describe("isTooSlowFresh", () => {
  const now = 1_800_000_000_000;

  it("keeps a fresh verdict", () => {
    expect(isTooSlowFresh(now - 1000, now)).toBe(true);
  });

  it("forgets a verdict older than the TTL", () => {
    expect(isTooSlowFresh(now - STORED_TTL_MS - 1, now)).toBe(false);
  });

  it("forgets a verdict from the future", () => {
    expect(isTooSlowFresh(now + 1, now)).toBe(false);
  });

  it("has no verdict when nothing is stored", () => {
    expect(isTooSlowFresh(null, now)).toBe(false);
  });
});

describe("tooSlowSchema", () => {
  it("reads a stored timestamp", () => {
    expect(tooSlowSchema.parse(123)).toBe(123);
  });

  it.each([undefined, null, "123", {}, "static"])("reads %j as no verdict", (value) => {
    expect(tooSlowSchema.parse(value)).toBeNull();
  });
});
