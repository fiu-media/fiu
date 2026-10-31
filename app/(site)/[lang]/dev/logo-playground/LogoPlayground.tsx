"use client";

import dynamic from "next/dynamic";
import Image, { type StaticImageData } from "next/image";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { LogoMeshMode } from "@/components/three/buildLogoGeometry";
import {
  formatConfigExport,
  formatInteractionConfigExport,
  formatLightingConfigExport,
  formatMaterialConfigExport,
  importPlaygroundConfig,
  LOGO_PARAM_PRESETS,
  presetConfig,
  resetInteractionParams,
  resetLightingParams,
  resetMaterialParams,
  type LogoDisplayMode,
  type LogoGlassParams,
  type LogoImportKind,
  type LogoPlaygroundConfig,
  type LogoPointLightConfig,
  type LogoRimLook,
  type LogoSoftLightConfig,
} from "@/components/three/logoConfig";
import type { SweepAxis, SweepTechnique } from "@/components/three/lightSweep";
import { diffConfigs } from "@/components/three/logoDiff";
import { costVsPreset, type LogoPerfStats } from "@/components/three/logoPerf";
import { GlassPillButton } from "@/components/ui/Glass";
import logo from "@/public/brand/fiu-logo.svg";
import { LogoDiffView } from "./LogoDiffView";
import { useSweepState, type SweepMode } from "./useSweepState";

const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });

const ROTATE_SECONDS = 6;

type SectionTab = "material" | "lighting" | "interaction";
type ConfigTab = SectionTab | "changes";
const DEFAULT_TAB: ConfigTab = "material";
const TAB_EVENT = "logo-playground-tab";

function isConfigTab(value: string): value is ConfigTab {
  return value === "material" || value === "lighting" || value === "interaction" || value === "changes";
}

function subscribeTab(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(TAB_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(TAB_EVENT, onChange);
  };
}

function readTab(): ConfigTab {
  const hash = window.location.hash.slice(1);
  return isConfigTab(hash) ? hash : DEFAULT_TAB;
}

function useConfigTab() {
  return useSyncExternalStore(subscribeTab, readTab, () => DEFAULT_TAB);
}

function selectTab(tab: ConfigTab) {
  history.replaceState(null, "", `#${tab}`);
  window.dispatchEvent(new Event(TAB_EVENT));
}

export type PlaygroundStill = StaticImageData & { lightTint?: string; label?: string };

type SliderDef = {
  key: keyof LogoGlassParams;
  label: string;
  min: number;
  max: number;
  step: number;
};

const MATERIAL_SLIDERS: SliderDef[] = [
  { key: "thickness", label: "Thickness", min: 0.2, max: 4, step: 0.05 },
  { key: "backsideThickness", label: "Backside thickness", min: 0.2, max: 3, step: 0.05 },
  { key: "ior", label: "IOR", min: 1.1, max: 2.2, step: 0.01 },
  { key: "chromaticAberration", label: "Chromatic aberration", min: 0, max: 1.2, step: 0.01 },
  { key: "anisotropicBlur", label: "Anisotropic blur", min: 0, max: 1, step: 0.01 },
  { key: "distortion", label: "Distortion", min: 0, max: 0.5, step: 0.01 },
  { key: "distortionScale", label: "Distortion scale", min: 0, max: 1, step: 0.01 },
  { key: "roughness", label: "Roughness", min: 0, max: 0.5, step: 0.01 },
  { key: "clearcoat", label: "Clearcoat", min: 0, max: 1, step: 0.01 },
  { key: "clearcoatRoughness", label: "Clearcoat roughness", min: 0, max: 1, step: 0.01 },
  { key: "specularIntensity", label: "Specular", min: 0, max: 2, step: 0.05 },
  { key: "envMapIntensity", label: "Env map", min: 0, max: 5, step: 0.05 },
  { key: "backsideEnvMapIntensity", label: "Backside env", min: 0, max: 4, step: 0.05 },
  { key: "attenuationDistance", label: "Attenuation distance", min: 0.5, max: 12, step: 0.1 },
  { key: "samples", label: "Samples", min: 4, max: 32, step: 1 },
];

const GLOW_SLIDERS: SliderDef[] = [
  { key: "glowSat", label: "Glow sat mult", min: 0.5, max: 2, step: 0.01 },
  { key: "glowLift", label: "Glow lift", min: 0, max: 0.5, step: 0.01 },
  { key: "glowLMin", label: "Glow L min", min: 0.1, max: 0.9, step: 0.01 },
  { key: "glowLMax", label: "Glow L max", min: 0.3, max: 1, step: 0.01 },
];

const INTERACTION_SLIDERS: SliderDef[] = [
  { key: "dragPitchMax", label: "Drag pitch max (rad)", min: 0.1, max: 1.2, step: 0.01 },
  { key: "dragSensitivity", label: "Drag sensitivity", min: 0.001, max: 0.02, step: 0.0005 },
  { key: "hoverTiltX", label: "Hover tilt X", min: 0, max: 0.4, step: 0.01 },
  { key: "hoverTiltY", label: "Hover tilt Y", min: 0, max: 0.5, step: 0.01 },
  { key: "hoverLerp", label: "Hover snappiness", min: 1, max: 12, step: 0.5 },
  { key: "dragFriction", label: "Coast friction", min: 0.5, max: 8, step: 0.1 },
  { key: "dragSpring", label: "Yaw return spring", min: 10, max: 120, step: 1 },
  { key: "dragSpringDamp", label: "Yaw return damp", min: 1, max: 16, step: 0.1 },
  { key: "dragSpringPitch", label: "Pitch return spring", min: 10, max: 140, step: 1 },
  { key: "dragSpringPitchDamp", label: "Pitch return damp", min: 1, max: 16, step: 0.1 },
];

const SWEEP_MODES: { value: SweepMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "webgl", label: "WebGL" },
  { value: "css", label: "CSS" },
  { value: "both", label: "Both" },
];

const SWEEP_AXES: { value: SweepAxis; label: string }[] = [
  { value: "x", label: "X" },
  { value: "y", label: "Y" },
  { value: "orbit", label: "Orbit" },
];

const SWEEP_TECHNIQUES: { value: SweepTechnique; label: string; note: string }[] = [
  { value: "move", label: "Move lights", note: "Shifts the env lights and re-bakes the cubemap each frame." },
  { value: "rotate", label: "Rotate env", note: "Turns the baked cubemap, with no re-bake." },
];

const EXTRUDE_SLIDERS = [
  { key: "depth" as const, label: "Extrude depth", min: 0.05, max: 0.5, step: 0.01 },
  { key: "bevelThickness" as const, label: "Bevel thickness", min: 0.02, max: 0.25, step: 0.005 },
  { key: "bevelSize" as const, label: "Bevel size", min: 0.02, max: 0.25, step: 0.005 },
];

const DIFF_LABELS: Record<string, string> = {
  meshMode: "Mesh",
  rimLook: "Rim preset",
  display: "Display",
  backside: "Backside transmission",
  ...Object.fromEntries(
    [...MATERIAL_SLIDERS, ...GLOW_SLIDERS, ...INTERACTION_SLIDERS, ...EXTRUDE_SLIDERS].map((s) => [s.key, s.label]),
  ),
};

export function LogoPlayground({ stills }: { stills: PlaygroundStill[] }) {
  const [config, setConfig] = useState<LogoPlaygroundConfig>(() => presetConfig("light"));
  // null = diff against the committed preset; otherwise a pinned snapshot.
  const [pinned, setPinned] = useState<LogoPlaygroundConfig | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinText, setPinText] = useState("");
  const [index, setIndex] = useState(0);
  const [rotate, setRotate] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<"full" | SectionTab | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [perf, setPerf] = useState<LogoPerfStats | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const tab = useConfigTab();
  const { stageRef: sweepStageRef, ...sweep } = useSweepState();

  const cost = useMemo(() => costVsPreset(config.params, config.rimLook), [config.params, config.rimLook]);

  const baseline = useMemo(
    () => pinned ?? presetConfig(config.rimLook, config.meshMode),
    [pinned, config.rimLook, config.meshMode],
  );
  const baselineDiff = useMemo(() => diffConfigs(baseline, config, DIFF_LABELS), [baseline, config]);

  // Live preview of what the pasted import would do, before it is applied.
  const importPreview = useMemo(
    () => (importText.trim() ? importPlaygroundConfig(config, importText) : null),
    [config, importText],
  );
  const importDiff = useMemo(
    () => (importPreview?.ok ? diffConfigs(config, importPreview.config, DIFF_LABELS) : null),
    [config, importPreview],
  );
  const pinPreview = useMemo(
    () => (pinText.trim() ? importPlaygroundConfig(presetConfig(config.rimLook, config.meshMode), pinText) : null),
    [config.rimLook, config.meshMode, pinText],
  );

  useEffect(() => {
    if (!rotate || stills.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % stills.length), ROTATE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [rotate, stills.length]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);

  const sceneStills = useMemo(
    () =>
      stills.map(({ src, width, height, lightTint }) => ({
        src,
        width,
        height,
        lightTint,
      })),
    [stills],
  );

  const showLive = config.display === "live" && !failed;
  const showFallback = config.display === "fallback" || failed || (showLive && !sceneReady);

  const applyPreset = (rimLook: LogoRimLook) => {
    setFailed(false);
    // Keep sceneReady — remounting isn't needed; params update live. Clearing ready
    // without a remount left the fallback logo up forever (onReady never fires again).
    setConfig((c) => ({
      ...presetConfig(rimLook, c.meshMode),
      display: "live",
    }));
  };

  const setMeshMode = (meshMode: LogoMeshMode) => {
    // Boundary remounts on meshMode (see key below), so reset ready for the new intro.
    setSceneReady(false);
    setFailed(false);
    setConfig((c) => ({ ...c, meshMode }));
  };

  const setDisplay = (display: LogoDisplayMode) => {
    setFailed(false);
    if (display === "live") setSceneReady(false);
    else setPerf(null);
    setConfig((c) => ({ ...c, display }));
  };

  const patchParams = (patch: Partial<LogoGlassParams>) => {
    setConfig((c) => ({ ...c, params: { ...c.params, ...patch } }));
  };

  const setParam = <K extends keyof LogoGlassParams>(key: K, value: LogoGlassParams[K]) => {
    patchParams({ [key]: value } as Partial<LogoGlassParams>);
  };

  const patchSoftLight = (id: string, patch: Partial<LogoSoftLightConfig>) => {
    setConfig((c) => ({
      ...c,
      params: {
        ...c.params,
        lights: {
          ...c.params.lights,
          soft: c.params.lights.soft.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        },
      },
    }));
  };

  const patchPointLight = (id: string, patch: Partial<LogoPointLightConfig>) => {
    setConfig((c) => ({
      ...c,
      params: {
        ...c.params,
        lights: {
          ...c.params.lights,
          points: c.params.lights.points.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        },
      },
    }));
  };

  const writeClipboard = async (kind: "full" | SectionTab, payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copy this config:", payload);
    }
  };

  const copyFullConfig = () => writeClipboard("full", formatConfigExport(config));

  const applyImport = () => {
    const result = importPreview;
    if (!result?.ok) return;
    setFailed(false);
    if (result.config.meshMode !== config.meshMode || result.config.display !== config.display) {
      setSceneReady(false);
    }
    setConfig(result.config);
    setImportStatus(importSuccessLabel(result.kind));
    setImportText("");
    if (result.kind !== "full") selectTab(result.kind);
    window.setTimeout(() => setImportStatus(null), 2200);
  };

  const pinConfig = (next: LogoPlaygroundConfig) => {
    setPinned(next);
    setPinOpen(false);
    setPinText("");
  };

  const copyTabConfig = (section: SectionTab) => {
    const payload =
      section === "material"
        ? formatMaterialConfigExport(config)
        : section === "lighting"
          ? formatLightingConfigExport(config)
          : formatInteractionConfigExport(config);
    return writeClipboard(section, payload);
  };

  const resetTab = (section: SectionTab) => {
    setConfig((c) => ({
      ...c,
      params:
        section === "material"
          ? resetMaterialParams(c.params, c.rimLook)
          : section === "lighting"
            ? resetLightingParams(c.params, c.rimLook)
            : resetInteractionParams(c.params, c.rimLook),
    }));
  };

  return (
    <div className="relative h-[calc(100dvh-var(--dev-bar))] overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        {stills.map((still, i) => (
          <Image
            key={still.src}
            src={still}
            alt=""
            fill
            priority={i === 0}
            placeholder="blur"
            quality={90}
            sizes="100vw"
            className="object-cover transition-opacity duration-[1600ms] ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 md:justify-start md:pl-[4vw]"
        style={{ opacity: showFallback ? 1 : 0 }}
      >
        <Image
          src={logo}
          alt=""
          priority
          sizes="(min-width: 768px) 42vw, 80vw"
          className="h-auto w-[80vw] max-w-[640px] md:w-[42vw] md:max-w-none"
        />
      </div>

      {showLive && (
        <SceneBoundary key={`${config.meshMode}-${config.display}`} onError={onFail}>
          <div
            aria-hidden
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: sceneReady ? 1 : 0 }}
          >
            <LogoScene
              stills={sceneStills}
              index={index}
              onReady={onReady}
              meshMode={config.meshMode}
              rimLook={config.rimLook}
              params={config.params}
              measurePerf
              sweep={sweep.sweep}
              onPerf={setPerf}
            />
          </div>
        </SceneBoundary>
      )}

      {/* Carries the CSS light sweep: every glass piece below inherits it. The canvas stays clickable. */}
      <div
        ref={sweepStageRef}
        className="sweep-stage pointer-events-none absolute inset-0"
        data-sweep-axis={sweep.css ? sweep.state.axis : undefined}
        data-sweep-paused={sweep.paused ? "" : undefined}
        style={
          {
            "--sweep-period": `${sweep.state.periodSeconds}s`,
            "--sweep-amp": sweep.state.amplitude,
          } as CSSProperties
        }
      >
      <header className="pointer-events-auto absolute top-0 right-0 left-0 z-30 flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium tracking-wide">Fiú · logo playground</p>
          <p className="text-xs text-white/55">/dev/logo-playground · unlisted</p>
        </div>
        <div className="flex gap-1.5">
          <GlassPillButton size="sm" onImage onClick={() => setPanelOpen((o) => !o)}>
            {panelOpen ? "Hide panel" : "Show panel"}
          </GlassPillButton>
          <GlassPillButton
            size="sm"
            onImage
            aria-pressed={importOpen}
            onClick={() => {
              setImportOpen((o) => !o);
              setImportStatus(null);
              setPanelOpen(true);
            }}
          >
            Import
          </GlassPillButton>
          <GlassPillButton size="sm" onImage onClick={copyFullConfig}>
            {copied === "full" ? "Copied" : "Copy all"}
          </GlassPillButton>
        </div>
      </header>

      {panelOpen && (
        <aside className="pointer-events-auto absolute top-16 right-3 bottom-3 z-30 flex w-[min(100%-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/55 shadow-2xl backdrop-blur-xl">
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2.5">
            <div role="tablist" aria-label="Config section" className="flex flex-wrap gap-1.5">
              <GlassPillButton
                size="sm"
                onImage
                role="tab"
                aria-selected={tab === "material"}
                onClick={() => selectTab("material")}
              >
                Material
              </GlassPillButton>
              <GlassPillButton
                size="sm"
                onImage
                role="tab"
                aria-selected={tab === "lighting"}
                onClick={() => selectTab("lighting")}
              >
                Lighting
              </GlassPillButton>
              <GlassPillButton
                size="sm"
                onImage
                role="tab"
                aria-selected={tab === "interaction"}
                onClick={() => selectTab("interaction")}
              >
                Interaction
              </GlassPillButton>
              <GlassPillButton
                size="sm"
                onImage
                role="tab"
                aria-selected={tab === "changes"}
                onClick={() => selectTab("changes")}
              >
                Changes
                {baselineDiff.entries.length > 0 && (
                  <span className="ml-1 tabular-nums text-white/60">{baselineDiff.entries.length}</span>
                )}
              </GlassPillButton>
            </div>
            {tab !== "changes" && (
              <>
                <GlassPillButton size="sm" onImage onClick={() => resetTab(tab)}>
                  Reset
                </GlassPillButton>
                <GlassPillButton size="sm" onImage onClick={() => copyTabConfig(tab)}>
                  {copied === tab ? "Copied" : "Copy"}
                </GlassPillButton>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-sm">
            {importOpen && (
              <Section title="Import config">
                <p className="mb-2 text-[11px] leading-snug text-white/55">
                  Paste a copied <code className="text-white/70">fiu-logo-config</code>, material, lighting, or
                  interaction snapshot. Partial imports only overwrite that section.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportStatus(null);
                  }}
                  spellCheck={false}
                  rows={7}
                  placeholder={'```fiu-logo-config\n{ ... }\n```'}
                  className="w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-snug text-white/90 outline-none placeholder:text-white/30 focus:border-white/35"
                />
                {importPreview && !importPreview.ok && (
                  <p className="mt-2 text-[11px] text-rose-300">{importPreview.error}</p>
                )}
                {importPreview?.ok && importDiff && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-white/55">
                      Preview · {importPreview.kind === "full" ? "full config" : `${importPreview.kind} section`} vs
                      current
                    </p>
                    {(importPreview.config.meshMode !== config.meshMode ||
                      importPreview.config.display !== config.display) && (
                      <p className="text-[11px] text-amber-300">Mesh or display changes, so the scene will remount.</p>
                    )}
                    <LogoDiffView diff={importDiff} emptyText="This import matches the current config." />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <GlassPillButton
                    size="sm"
                    onImage
                    onClick={applyImport}
                    disabled={!importDiff || importDiff.entries.length === 0}
                  >
                    {importDiff ? `Apply (${importDiff.entries.length})` : "Apply"}
                  </GlassPillButton>
                  <GlassPillButton
                    size="sm"
                    onImage
                    onClick={() => {
                      setImportText("");
                      setImportStatus(null);
                    }}
                  >
                    Cancel
                  </GlassPillButton>
                  {importStatus && <span className="text-[11px] text-white/60">{importStatus}</span>}
                </div>
              </Section>
            )}

            {tab === "changes" && (
              <Section title={pinned ? "Changes vs pinned snapshot" : "Changes vs master"}>
                <div className="mb-3 space-y-2">
                  <p className="text-[11px] leading-snug text-white/55">
                    {pinned ? (
                      "Comparing against a snapshot you pinned this session."
                    ) : (
                      <>
                        Comparing against the committed <code className="text-white/70">{config.rimLook}</code> preset,
                        which is what the site renders.
                      </>
                    )}
                  </p>
                  <PillRow>
                    <GlassPillButton size="sm" onImage aria-pressed={!pinned} onClick={() => setPinned(null)}>
                      Committed preset
                    </GlassPillButton>
                    <GlassPillButton size="sm" onImage aria-pressed={Boolean(pinned)} onClick={() => pinConfig(config)}>
                      Pin current
                    </GlassPillButton>
                    <GlassPillButton size="sm" onImage aria-pressed={pinOpen} onClick={() => setPinOpen((o) => !o)}>
                      Pin from paste
                    </GlassPillButton>
                  </PillRow>
                  {pinOpen && (
                    <div className="space-y-2">
                      <textarea
                        value={pinText}
                        onChange={(e) => setPinText(e.target.value)}
                        spellCheck={false}
                        rows={5}
                        placeholder={'```fiu-logo-config\n{ ... }\n```'}
                        className="w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-snug text-white/90 outline-none placeholder:text-white/30 focus:border-white/35"
                      />
                      {pinPreview && !pinPreview.ok && <p className="text-[11px] text-rose-300">{pinPreview.error}</p>}
                      <GlassPillButton
                        size="sm"
                        onImage
                        disabled={!pinPreview?.ok}
                        onClick={() => pinPreview?.ok && pinConfig(pinPreview.config)}
                      >
                        Use as baseline
                      </GlassPillButton>
                    </div>
                  )}
                </div>
                <LogoDiffView
                  diff={baselineDiff}
                  emptyText={pinned ? "Identical to the pinned snapshot." : "Identical to the committed preset."}
                />
              </Section>
            )}

            {tab !== "changes" && (
              <>
            <Section title="Display">
              <PillRow>
                <GlassPillButton size="sm" onImage aria-pressed={config.display === "live"} onClick={() => setDisplay("live")}>
                  Live glass
                </GlassPillButton>
                <GlassPillButton
                  size="sm"
                  onImage
                  aria-pressed={config.display === "fallback"}
                  onClick={() => setDisplay("fallback")}
                >
                  Fallback logo
                </GlassPillButton>
              </PillRow>
            </Section>

            <Section title="Mesh">
              <PillRow>
                <GlassPillButton
                  size="sm"
                  onImage
                  aria-pressed={config.meshMode === "extrude"}
                  onClick={() => setMeshMode("extrude")}
                >
                  Extrude
                </GlassPillButton>
                <GlassPillButton
                  size="sm"
                  onImage
                  aria-pressed={config.meshMode === "tubes"}
                  onClick={() => setMeshMode("tubes")}
                >
                  Tubes
                </GlassPillButton>
              </PillRow>
            </Section>

            <Section title="Rim preset">
              <PillRow>
                <GlassPillButton
                  size="sm"
                  onImage
                  aria-pressed={config.rimLook === "light" && config.display === "live"}
                  onClick={() => applyPreset("light")}
                >
                  Light
                </GlassPillButton>
                <GlassPillButton
                  size="sm"
                  onImage
                  aria-pressed={config.rimLook === "dark" && config.display === "live"}
                  onClick={() => applyPreset("dark")}
                >
                  Dark
                </GlassPillButton>
              </PillRow>
            </Section>

            <Section title="Still">
              <PillRow>
                <GlassPillButton size="sm" onImage aria-pressed={rotate} onClick={() => setRotate((r) => !r)}>
                  {rotate ? "Auto-rotate on" : "Auto-rotate off"}
                </GlassPillButton>
              </PillRow>
              <label className="mt-2 flex flex-col gap-1 text-xs text-white/70">
                Frame {index + 1}/{stills.length}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, stills.length - 1)}
                  step={1}
                  value={index}
                  onChange={(e) => {
                    setRotate(false);
                    setIndex(Number(e.target.value));
                  }}
                  className="w-full accent-white"
                />
              </label>
            </Section>

            <PerfMeter
              live={showLive && sceneReady}
              perf={perf}
              cost={cost}
              rimLook={config.rimLook}
              samples={config.params.samples}
              backside={config.params.backside}
            />
              </>
            )}

            {tab === "material" && (
              <>
                <Section title="Material">
                  <label className="mb-3 flex items-center gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={config.params.backside}
                      onChange={(e) => setParam("backside", e.target.checked)}
                      className="accent-white"
                    />
                    Backside transmission (richer rims, ~2× FBO cost)
                  </label>
                  {MATERIAL_SLIDERS.map((s) => (
                    <Slider
                      key={s.key}
                      label={s.label}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={Number(config.params[s.key])}
                      onChange={(v) => setParam(s.key, v as never)}
                    />
                  ))}
                </Section>

                <Section title="Glow / attenuation tint">
                  {GLOW_SLIDERS.map((s) => (
                    <Slider
                      key={s.key}
                      label={s.label}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={Number(config.params[s.key])}
                      onChange={(v) => setParam(s.key, v as never)}
                    />
                  ))}
                </Section>

                {config.meshMode === "extrude" && (
                  <Section title="Extrude geometry">
                    <label className="mb-2 flex items-center gap-2 text-xs text-white/80">
                      <input
                        type="checkbox"
                        checked={Boolean(config.params.extrude)}
                        onChange={(e) =>
                          setParam(
                            "extrude",
                            e.target.checked
                              ? {
                                  ...(LOGO_PARAM_PRESETS.light.extrude ?? {
                                    depth: 0.16,
                                    bevelThickness: 0.12,
                                    bevelSize: 0.12,
                                  }),
                                }
                              : null,
                          )
                        }
                        className="accent-white"
                      />
                      Override extrude (off = paths JSON defaults)
                    </label>
                    {config.params.extrude &&
                      EXTRUDE_SLIDERS.map((s) => (
                        <Slider
                          key={s.key}
                          label={s.label}
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={config.params.extrude![s.key]}
                          onChange={(v) =>
                            setParam("extrude", {
                              ...config.params.extrude!,
                              [s.key]: v,
                            })
                          }
                        />
                      ))}
                  </Section>
                )}
              </>
            )}

            {tab === "lighting" && (
              <>
                <Section title="Moving light">
                  <p className="mb-2 text-[11px] leading-snug text-white/55">
                    Slowly sweeps a light across the scene (issue #51). Not part of the exported config.
                  </p>
                  <PillRow>
                    {SWEEP_MODES.map((m) => (
                      <GlassPillButton
                        key={m.value}
                        size="sm"
                        onImage
                        aria-pressed={sweep.state.mode === m.value}
                        onClick={() => sweep.patch({ mode: m.value })}
                      >
                        {m.label}
                      </GlassPillButton>
                    ))}
                  </PillRow>
                  {sweep.state.mode !== "off" && (
                    <div className="mt-3 space-y-3">
                      <PillRow>
                        {SWEEP_AXES.map((a) => (
                          <GlassPillButton
                            key={a.value}
                            size="sm"
                            onImage
                            aria-pressed={sweep.state.axis === a.value}
                            onClick={() => sweep.patch({ axis: a.value })}
                          >
                            {a.label}
                          </GlassPillButton>
                        ))}
                        <GlassPillButton size="sm" onImage aria-pressed={sweep.paused} onClick={sweep.togglePause}>
                          {sweep.paused ? "Resume" : "Pause"}
                        </GlassPillButton>
                      </PillRow>
                      {sweep.state.mode !== "css" && (
                        <div>
                          <PillRow>
                            {SWEEP_TECHNIQUES.map((t) => (
                              <GlassPillButton
                                key={t.value}
                                size="sm"
                                onImage
                                aria-pressed={sweep.state.technique === t.value}
                                onClick={() => sweep.patch({ technique: t.value })}
                              >
                                {t.label}
                              </GlassPillButton>
                            ))}
                          </PillRow>
                          <p className="mt-1.5 text-[11px] leading-snug text-white/55">
                            {SWEEP_TECHNIQUES.find((t) => t.value === sweep.state.technique)?.note}
                          </p>
                        </div>
                      )}
                      <Slider
                        label="Period (s)"
                        min={8}
                        max={90}
                        step={1}
                        value={sweep.state.periodSeconds}
                        onChange={sweep.setPeriod}
                      />
                      <Slider
                        label="Travel"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={sweep.state.amplitude}
                        onChange={(amplitude) => sweep.patch({ amplitude })}
                      />
                    </div>
                  )}
                </Section>

                <Section title="Env soft lights">
                  <div className="space-y-2">
                    {config.params.lights.soft.map((light) => (
                      <SoftLightEditor
                        key={light.id}
                        light={light}
                        onChange={(patch) => patchSoftLight(light.id, patch)}
                      />
                    ))}
                  </div>
                </Section>

                <Section title="Point lights">
                  <div className="space-y-2">
                    {config.params.lights.points.map((light) => (
                      <PointLightEditor
                        key={light.id}
                        light={light}
                        onChange={(patch) => patchPointLight(light.id, patch)}
                      />
                    ))}
                  </div>
                </Section>
              </>
            )}

            {tab === "interaction" && (
              <Section title="Drag & hover">
                {INTERACTION_SLIDERS.map((s) => (
                  <Slider
                    key={s.key}
                    label={s.label}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={Number(config.params[s.key])}
                    onChange={(v) => setParam(s.key, v as never)}
                  />
                ))}
              </Section>
            )}
          </div>
          <p className="border-t border-white/10 px-4 py-2 text-[11px] leading-snug text-white/45">
            Tab copy exports <code className="text-white/70">fiu-logo-material</code>,{" "}
            <code className="text-white/70">fiu-logo-lighting</code>, or{" "}
            <code className="text-white/70">fiu-logo-interaction</code>. Copy all / Import use{" "}
            <code className="text-white/70">fiu-logo-config</code> (or a tab snapshot).
          </p>
        </aside>
      )}
      </div>
    </div>
  );
}

function importSuccessLabel(kind: LogoImportKind) {
  if (kind === "full") return "Applied full config.";
  return `Applied ${kind} config.`;
}

function PerfMeter({
  live,
  perf,
  cost,
  rimLook,
  samples,
  backside,
}: {
  live: boolean;
  perf: LogoPerfStats | null;
  cost: ReturnType<typeof costVsPreset>;
  rimLook: LogoRimLook;
  samples: number;
  backside: boolean;
}) {
  const ratioLabel = `${cost.ratio < 0.995 ? "" : cost.ratio > 1.005 ? "+" : ""}${((cost.ratio - 1) * 100).toFixed(0)}%`;
  const loadTone =
    cost.ratio <= 1.05 ? "text-emerald-300" : cost.ratio <= 1.35 ? "text-amber-300" : "text-rose-300";
  const fpsTone =
    !live || !perf
      ? "text-white/45"
      : perf.fps >= 50
        ? "text-emerald-300"
        : perf.fps >= 30
          ? "text-amber-300"
          : "text-rose-300";

  const maxPart = Math.max(cost.transmission, cost.soft, cost.points, 1);

  return (
    <Section title="Performance">
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-lg font-medium tabular-nums ${fpsTone}`}>
            {live && perf ? `${perf.fps.toFixed(0)} fps` : "— fps"}
          </span>
          <span className="text-xs tabular-nums text-white/55">
            {live && perf ? `${perf.frameMs.toFixed(1)} ms` : "waiting"}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-white/55">vs {rimLook} preset</span>
          <span className={`text-sm font-medium tabular-nums ${loadTone}`}>
            {cost.ratio.toFixed(2)}× <span className="text-white/45">({ratioLabel})</span>
          </span>
        </div>

        <CostBar
          label="Transmission"
          value={cost.transmission}
          max={maxPart}
          detail={`${samples} samp${backside ? " · back" : ""}`}
        />
        <CostBar label="Soft lights" value={cost.soft} max={maxPart} detail={`${cost.softOn} on`} />
        <CostBar label="Point lights" value={cost.points} max={maxPart} detail={`${cost.pointsOn} on`} />

        {live && perf ? (
          <p className="pt-0.5 text-[10px] tabular-nums text-white/40">
            {perf.triangles.toLocaleString()} tris · {perf.calls} draw calls
          </p>
        ) : (
          <p className="pt-0.5 text-[10px] text-white/40">Live FPS needs Live glass running.</p>
        )}
      </div>
    </Section>
  );
}

function CostBar({
  label,
  value,
  max,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-[10px] text-white/55">
        <span>{label}</span>
        <span className="tabular-nums text-white/70">{detail}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/55" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-white/50 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-2 flex flex-col gap-1 text-xs text-white/70">
      <span className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="tabular-nums text-white/90">
          {Number.isInteger(step) ? value : value.toFixed(step < 0.01 ? 4 : 2)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
    </label>
  );
}

function SoftLightEditor({
  light,
  onChange,
}: {
  light: LogoSoftLightConfig;
  onChange: (patch: Partial<LogoSoftLightConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/85"
        onClick={() => setOpen((o) => !o)}
      >
        <input
          type="checkbox"
          checked={light.enabled}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="accent-white"
        />
        <span className="flex-1 truncate">{light.label}</span>
        <span className="text-white/40">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-3 pt-2 pb-2">
          <p className="mb-1 text-[10px] tracking-wide text-white/40 uppercase">
            {light.kind}
            {light.followPose ? " · follows pose" : ""}
            {light.feather ? " · feathered" : ""}
          </p>
          <Slider label="X" min={-16} max={16} step={0.1} value={light.x} onChange={(v) => onChange({ x: v })} />
          <Slider label="Y" min={-16} max={16} step={0.1} value={light.y} onChange={(v) => onChange({ y: v })} />
          <Slider label="Z" min={-16} max={16} step={0.1} value={light.z} onChange={(v) => onChange({ z: v })} />
          <Slider label="Scale X" min={0.1} max={20} step={0.05} value={light.scaleX} onChange={(v) => onChange({ scaleX: v })} />
          <Slider label="Scale Y" min={0.1} max={20} step={0.05} value={light.scaleY} onChange={(v) => onChange({ scaleY: v })} />
          <Slider label="Scale Z" min={0.1} max={20} step={0.05} value={light.scaleZ} onChange={(v) => onChange({ scaleZ: v })} />
          <Slider label="Intensity" min={0} max={20} step={0.1} value={light.intensity} onChange={(v) => onChange({ intensity: v })} />
          <Slider label="Mix white" min={0} max={1} step={0.01} value={light.mixWhite} onChange={(v) => onChange({ mixWhite: v })} />
          <Slider label="Lift" min={0} max={2} step={0.05} value={light.lift} onChange={(v) => onChange({ lift: v })} />
          {light.kind === "streak" && (
            <Slider label="Roll (rad)" min={-Math.PI} max={Math.PI} step={0.05} value={light.roll} onChange={(v) => onChange({ roll: v })} />
          )}
          <label className="flex items-center gap-2 text-xs text-white/75">
            <input
              type="checkbox"
              checked={light.followPose}
              onChange={(e) => onChange({ followPose: e.target.checked })}
              className="accent-white"
            />
            Follow logo pose
          </label>
        </div>
      )}
    </div>
  );
}

function PointLightEditor({
  light,
  onChange,
}: {
  light: LogoPointLightConfig;
  onChange: (patch: Partial<LogoPointLightConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/85"
        onClick={() => setOpen((o) => !o)}
      >
        <input
          type="checkbox"
          checked={light.enabled}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="accent-white"
        />
        <span className="flex-1 truncate">{light.label}</span>
        <span className="text-white/40">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-3 pt-2 pb-2">
          <Slider label="X" min={-16} max={16} step={0.1} value={light.x} onChange={(v) => onChange({ x: v })} />
          <Slider label="Y" min={-16} max={16} step={0.1} value={light.y} onChange={(v) => onChange({ y: v })} />
          <Slider label="Z" min={-16} max={16} step={0.1} value={light.z} onChange={(v) => onChange({ z: v })} />
          <Slider label="Intensity" min={0} max={60} step={0.5} value={light.intensity} onChange={(v) => onChange({ intensity: v })} />
          <Slider label="Distance" min={1} max={40} step={0.5} value={light.distance} onChange={(v) => onChange({ distance: v })} />
          <Slider label="Decay" min={0} max={4} step={0.05} value={light.decay} onChange={(v) => onChange({ decay: v })} />
          <label className="mb-2 flex flex-col gap-1 text-xs text-white/70">
            Color
            <input
              type="color"
              value={light.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border border-white/15 bg-transparent"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/75">
            <input
              type="checkbox"
              checked={light.followPose}
              onChange={(e) => onChange({ followPose: e.target.checked })}
              className="accent-white"
            />
            Follow logo pose
          </label>
        </div>
      )}
    </div>
  );
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[LogoPlayground] live logo failed:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
