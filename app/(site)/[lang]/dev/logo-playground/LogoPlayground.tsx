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
import { DIFF_LABELS } from "./logoControls";
import { useSweepState, type SweepMode } from "./useSweepState";

const LogoScene = dynamic(() => import("@/components/three/LogoScene"), { ssr: false });
// Leva reads Math.random while creating its store, so it renders on the client only.
const LevaParams = dynamic(() => import("./LevaParams").then((m) => m.LevaParams), { ssr: false });

const ROTATE_SECONDS = 6;

type SectionTab = "material" | "lighting" | "interaction";
type ConfigTab = "controls" | "changes";
const SECTION_TABS: SectionTab[] = ["material", "lighting", "interaction"];
const DEFAULT_TAB: ConfigTab = "controls";
const TAB_EVENT = "logo-playground-tab";

function isConfigTab(value: string): value is ConfigTab {
  return value === "controls" || value === "changes";
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
  // What the Leva panel shows. Replaced only when the config is replaced wholesale, never on a slider edit.
  const [loaded, setLoaded] = useState(config.params);
  const [panelSlot, setPanelSlot] = useState<HTMLDivElement | null>(null);
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

  // Leva scrolls folders into view as they settle after mount, which leaves the panel at the bottom.
  // Keep it at the top for a moment, until the user touches it.
  useEffect(() => {
    const scroller = panelSlot?.parentElement;
    if (!panelSlot || !scroller) return;
    const settled = performance.now() + 2000;
    const pin = () => {
      if (performance.now() < settled) scroller.scrollTo(0, 0);
    };
    const release = () => panelSlot.removeEventListener("transitionend", pin);
    pin();
    panelSlot.addEventListener("transitionend", pin);
    scroller.addEventListener("wheel", release, { once: true });
    scroller.addEventListener("pointerdown", release, { once: true });
    return () => {
      release();
      scroller.removeEventListener("wheel", release);
      scroller.removeEventListener("pointerdown", release);
    };
  }, [panelSlot]);

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
    const next: LogoPlaygroundConfig = { ...presetConfig(rimLook, config.meshMode), display: "live" };
    setConfig(next);
    setLoaded(next.params);
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

  const setParam = useCallback(<K extends keyof LogoGlassParams>(key: K, value: LogoGlassParams[K]) => {
    setConfig((c) => ({ ...c, params: { ...c.params, [key]: value } }));
  }, []);

  const patchSoftLight = useCallback((id: string, patch: Partial<LogoSoftLightConfig>) => {
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
  }, []);

  const patchPointLight = useCallback((id: string, patch: Partial<LogoPointLightConfig>) => {
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
  }, []);

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
    setLoaded(result.config.params);
    setImportStatus(importSuccessLabel(result.kind));
    setImportText("");
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
    const params =
      section === "material"
        ? resetMaterialParams(config.params, config.rimLook)
        : section === "lighting"
          ? resetLightingParams(config.params, config.rimLook)
          : resetInteractionParams(config.params, config.rimLook);
    setConfig({ ...config, params });
    setLoaded(params);
  };

  return (
    <div className="relative h-[calc(100dvh-var(--dev-bar))] overflow-hidden bg-ink text-white">
      <LevaParams
        params={config.params}
        loaded={loaded}
        meshMode={config.meshMode}
        container={panelSlot}
        onParam={setParam}
        onSoft={patchSoftLight}
        onPoint={patchPointLight}
      />
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
          <div aria-hidden className="absolute inset-0 transition-opacity duration-500" style={{ opacity: sceneReady ? 1 : 0 }}>
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
              <div role="tablist" aria-label="Panel view" className="flex flex-wrap gap-1.5">
                <GlassPillButton
                  size="sm"
                  onImage
                  role="tab"
                  aria-selected={tab === "controls"}
                  onClick={() => selectTab("controls")}
                >
                  Controls
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
                    <span className="ml-1 text-white/60 tabular-nums">{baselineDiff.entries.length}</span>
                  )}
                </GlassPillButton>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-sm">
              {importOpen && (
                <Section title="Import config">
                  <p className="mb-2 text-[11px] leading-snug text-white/55">
                    Paste a copied <code className="text-white/70">fiu-logo-config</code>, material, lighting, or interaction
                    snapshot. Partial imports only overwrite that section.
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportStatus(null);
                    }}
                    spellCheck={false}
                    rows={7}
                    placeholder={"```fiu-logo-config\n{ ... }\n```"}
                    className="w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-snug text-white/90 outline-none placeholder:text-white/30 focus:border-white/35"
                  />
                  {importPreview && !importPreview.ok && <p className="mt-2 text-[11px] text-rose-300">{importPreview.error}</p>}
                  {importPreview?.ok && importDiff && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] text-white/55">
                        Preview · {importPreview.kind === "full" ? "full config" : `${importPreview.kind} section`} vs current
                      </p>
                      {(importPreview.config.meshMode !== config.meshMode || importPreview.config.display !== config.display) && (
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
                          Comparing against the committed <code className="text-white/70">{config.rimLook}</code> preset, which is
                          what the site renders.
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
                          placeholder={"```fiu-logo-config\n{ ... }\n```"}
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
                      <GlassPillButton
                        size="sm"
                        onImage
                        aria-pressed={config.display === "live"}
                        onClick={() => setDisplay("live")}
                      >
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

              {tab === "controls" && (
                <>
                  <Section title="Snapshots">
                    <div className="space-y-1.5">
                      {SECTION_TABS.map((section) => (
                        <div key={section} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-white/70 capitalize">{section}</span>
                          <PillRow>
                            <GlassPillButton size="sm" onImage onClick={() => resetTab(section)}>
                              Reset
                            </GlassPillButton>
                            <GlassPillButton size="sm" onImage onClick={() => copyTabConfig(section)}>
                              {copied === section ? "Copied" : "Copy"}
                            </GlassPillButton>
                          </PillRow>
                        </div>
                      ))}
                    </div>
                  </Section>

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

                  <div ref={setPanelSlot} />
                </>
              )}
            </div>
            <p className="border-t border-white/10 px-4 py-2 text-[11px] leading-snug text-white/45">
              Snapshot copy exports <code className="text-white/70">fiu-logo-material</code>,{" "}
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
  const loadTone = cost.ratio <= 1.05 ? "text-emerald-300" : cost.ratio <= 1.35 ? "text-amber-300" : "text-rose-300";
  const fpsTone =
    !live || !perf ? "text-white/45" : perf.fps >= 50 ? "text-emerald-300" : perf.fps >= 30 ? "text-amber-300" : "text-rose-300";

  const maxPart = Math.max(cost.transmission, cost.soft, cost.points, 1);

  return (
    <Section title="Performance">
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-lg font-medium tabular-nums ${fpsTone}`}>
            {live && perf ? `${perf.fps.toFixed(0)} fps` : "— fps"}
          </span>
          <span className="text-xs text-white/55 tabular-nums">{live && perf ? `${perf.frameMs.toFixed(1)} ms` : "waiting"}</span>
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
          <p className="pt-0.5 text-[10px] text-white/40 tabular-nums">
            {perf.triangles.toLocaleString()} tris · {perf.calls} draw calls
          </p>
        ) : (
          <p className="pt-0.5 text-[10px] text-white/40">Live FPS needs Live glass running.</p>
        )}
      </div>
    </Section>
  );
}

function CostBar({ label, value, max, detail }: { label: string; value: number; max: number; detail: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-[10px] text-white/55">
        <span>{label}</span>
        <span className="text-white/70 tabular-nums">{detail}</span>
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
        <span className="text-white/90 tabular-nums">{Number.isInteger(step) ? value : value.toFixed(step < 0.01 ? 4 : 2)}</span>
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
