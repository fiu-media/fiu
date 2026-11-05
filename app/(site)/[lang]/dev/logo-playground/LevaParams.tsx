"use client";

import { LevaPanel, useControls, useCreateStore } from "leva";
import type { Schema } from "leva/dist/declarations/src/types";
import { useEffect, useEffectEvent, useRef } from "react";
import { createPortal } from "react-dom";
import type { LogoMeshMode } from "@/components/three/buildLogoGeometry";
import type {
  LogoExtrudeOverride,
  LogoGlassParams,
  LogoPointLightConfig,
  LogoSoftLightConfig,
} from "@/components/three/logoConfig";
import {
  DEFAULT_EXTRUDE,
  EXTRUDE_SLIDERS,
  GLOW_SLIDERS,
  INTERACTION_SLIDERS,
  MATERIAL_SLIDERS,
  type SliderDef,
  type SliderRange,
} from "./logoControls";

type Store = ReturnType<typeof useCreateStore>;
type Getter = (path: string) => number;
type Vec3 = { x: number; y: number; z: number };

type Callbacks = {
  onParam: <K extends keyof LogoGlassParams>(key: K, value: LogoGlassParams[K]) => void;
  onSoft: (id: string, patch: Partial<LogoSoftLightConfig>) => void;
  onPoint: (id: string, patch: Partial<LogoPointLightConfig>) => void;
};

type LevaParamsProps = Callbacks & {
  /** Live config params. Folders read them once, when they mount. */
  params: LogoGlassParams;
  /** Params the panel should show. Replaced only when the config is replaced wholesale (preset, import, reset). */
  loaded: LogoGlassParams;
  meshMode: LogoMeshMode;
  /** Where the panel renders. Folders stay mounted without it, so values survive hiding the panel. */
  container: HTMLElement | null;
};

const EXTRUDE_FOLDER = "Extrude geometry";
const SOFT_FOLDER = "Env soft lights";
const POINT_FOLDER = "Point lights";

/**
 * Runs `apply` for edits made in the panel. Leva also calls `onChange` once with the initial
 * value, which must not write back into the config.
 */
function fromPanel<T>(apply: (value: T, get: Getter) => void) {
  return (value: T, _path: string, context: { initial: boolean; get: Getter }) => {
    if (!context.initial) apply(value, context.get);
  };
}

function slider(def: SliderRange, value: number, apply: (value: number, get: Getter) => void) {
  return { value, min: def.min, max: def.max, step: def.step, label: def.label, onChange: fromPanel(apply) };
}

/** `{ key: item.value }` for every input in a schema, in the shape Leva's `set` takes. */
function valuesOf(schema: Schema): Schema {
  const values: Schema = {};
  for (const [key, item] of Object.entries(schema)) {
    if (typeof item === "object" && item !== null && "value" in item) values[key] = item.value;
  }
  return values;
}

/**
 * Registers a folder from `build(params)` and reloads it whenever `loaded` changes.
 * The schema is built once (`[]` deps): rebuilding it each render makes Leva re-register every
 * input, and Leva keeps the value of a path that already exists, so only `set` refreshes it.
 */
function useFolder(
  store: Store,
  name: string,
  params: LogoGlassParams,
  loaded: LogoGlassParams,
  build: (params: LogoGlassParams) => Schema,
  collapsed?: boolean,
) {
  const [, set] = useControls(name, () => build(params), { collapsed }, { store }, []);
  const reload = useEffectEvent((next: LogoGlassParams) => set(valuesOf(build(next))));
  const mounted = useRef(false);
  useEffect(() => {
    // The first run is the mount, where the folder already holds `loaded`.
    if (mounted.current) reload(loaded);
    mounted.current = true;
  }, [loaded]);
}

/**
 * Leva is a view of the playground config, not a second copy: edits flow out through the
 * callbacks, and `loaded` pushes wholesale replacements back in.
 */
export function LevaParams({ params, loaded, meshMode, container, onParam, onSoft, onPoint }: LevaParamsProps) {
  const store = useCreateStore();
  const folderProps = { store, params, loaded };
  return (
    <>
      <SliderFolder {...folderProps} name="Material" defs={MATERIAL_SLIDERS} onParam={onParam} withBackside />
      <SliderFolder {...folderProps} name="Glow / attenuation" defs={GLOW_SLIDERS} onParam={onParam} />
      {meshMode === "extrude" && <ExtrudeFolder {...folderProps} onParam={onParam} />}
      <SliderFolder {...folderProps} name="Interaction" defs={INTERACTION_SLIDERS} onParam={onParam} />
      {params.lights.soft.map((light) => (
        <SoftLightFolder key={light.id} {...folderProps} id={light.id} label={light.label} onSoft={onSoft} />
      ))}
      {params.lights.points.map((light) => (
        <PointLightFolder key={light.id} {...folderProps} id={light.id} label={light.label} onPoint={onPoint} />
      ))}
      {container && createPortal(<LevaPanel store={store} fill flat titleBar={false} oneLineLabels theme={THEME} />, container)}
    </>
  );
}

type FolderProps = { store: Store; params: LogoGlassParams; loaded: LogoGlassParams };

function SliderFolder({
  store,
  params,
  loaded,
  name,
  defs,
  onParam,
  withBackside = false,
}: FolderProps & Pick<Callbacks, "onParam"> & { name: string; defs: SliderDef[]; withBackside?: boolean }) {
  useFolder(store, name, params, loaded, (p) => {
    const schema: Schema = {};
    if (withBackside) {
      schema.backside = {
        value: p.backside,
        label: "Backside transmission (~2× FBO cost)",
        onChange: fromPanel<boolean>((value) => onParam("backside", value)),
      };
    }
    for (const def of defs) {
      schema[def.key] = slider(def, p[def.key], (value) => onParam(def.key, value));
    }
    return schema;
  });
  return null;
}

function ExtrudeFolder({ store, params, loaded, onParam }: FolderProps & Pick<Callbacks, "onParam">) {
  useFolder(store, EXTRUDE_FOLDER, params, loaded, (p) => {
    const current = p.extrude ?? DEFAULT_EXTRUDE;
    const read = (get: Getter): LogoExtrudeOverride => ({
      depth: get(`${EXTRUDE_FOLDER}.depth`),
      bevelThickness: get(`${EXTRUDE_FOLDER}.bevelThickness`),
      bevelSize: get(`${EXTRUDE_FOLDER}.bevelSize`),
    });
    const schema: Schema = {
      override: {
        value: Boolean(p.extrude),
        label: "Override (off = paths JSON defaults)",
        onChange: fromPanel<boolean>((on, get) => onParam("extrude", on ? read(get) : null)),
      },
    };
    for (const def of EXTRUDE_SLIDERS) {
      schema[def.key] = {
        ...slider(def, current[def.key], (_value, get) => onParam("extrude", read(get))),
        render: (getValue: (path: string) => unknown) => Boolean(getValue(`${EXTRUDE_FOLDER}.override`)),
      };
    }
    return schema;
  });
  return null;
}

function SoftLightFolder({
  store,
  params,
  loaded,
  id,
  label,
  onSoft,
}: FolderProps & Pick<Callbacks, "onSoft"> & { id: string; label: string }) {
  useFolder(
    store,
    `${SOFT_FOLDER}.${label}`,
    params,
    loaded,
    (p) => {
      const light = p.lights.soft.find((l) => l.id === id);
      if (!light) return {};
      const schema: Schema = {
        enabled: { value: light.enabled, onChange: fromPanel<boolean>((enabled) => onSoft(id, { enabled })) },
        position: {
          value: { x: light.x, y: light.y, z: light.z },
          step: 0.1,
          onChange: fromPanel<Vec3>(({ x, y, z }) => onSoft(id, { x, y, z })),
        },
        scale: {
          value: { x: light.scaleX, y: light.scaleY, z: light.scaleZ },
          step: 0.05,
          onChange: fromPanel<Vec3>(({ x, y, z }) => onSoft(id, { scaleX: x, scaleY: y, scaleZ: z })),
        },
        intensity: {
          value: light.intensity,
          min: 0,
          max: 20,
          step: 0.1,
          onChange: fromPanel<number>((intensity) => onSoft(id, { intensity })),
        },
        mixWhite: {
          value: light.mixWhite,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Mix white",
          onChange: fromPanel<number>((mixWhite) => onSoft(id, { mixWhite })),
        },
        lift: {
          value: light.lift,
          min: 0,
          max: 2,
          step: 0.05,
          onChange: fromPanel<number>((lift) => onSoft(id, { lift })),
        },
      };
      if (light.kind === "streak") {
        schema.roll = {
          value: light.roll,
          min: -Math.PI,
          max: Math.PI,
          step: 0.05,
          label: "Roll (rad)",
          onChange: fromPanel<number>((roll) => onSoft(id, { roll })),
        };
      }
      schema.followPose = {
        value: light.followPose,
        label: "Follow logo pose",
        onChange: fromPanel<boolean>((followPose) => onSoft(id, { followPose })),
      };
      return schema;
    },
    true,
  );
  return null;
}

function PointLightFolder({
  store,
  params,
  loaded,
  id,
  label,
  onPoint,
}: FolderProps & Pick<Callbacks, "onPoint"> & { id: string; label: string }) {
  useFolder(
    store,
    `${POINT_FOLDER}.${label}`,
    params,
    loaded,
    (p) => {
      const light = p.lights.points.find((l) => l.id === id);
      if (!light) return {};
      const schema: Schema = {
        enabled: { value: light.enabled, onChange: fromPanel<boolean>((enabled) => onPoint(id, { enabled })) },
        position: {
          value: { x: light.x, y: light.y, z: light.z },
          step: 0.1,
          onChange: fromPanel<Vec3>(({ x, y, z }) => onPoint(id, { x, y, z })),
        },
        intensity: {
          value: light.intensity,
          min: 0,
          max: 60,
          step: 0.5,
          onChange: fromPanel<number>((intensity) => onPoint(id, { intensity })),
        },
        distance: {
          value: light.distance,
          min: 1,
          max: 40,
          step: 0.5,
          onChange: fromPanel<number>((distance) => onPoint(id, { distance })),
        },
        decay: {
          value: light.decay,
          min: 0,
          max: 4,
          step: 0.05,
          onChange: fromPanel<number>((decay) => onPoint(id, { decay })),
        },
        color: { value: light.color, onChange: fromPanel<string>((color) => onPoint(id, { color })) },
        followPose: {
          value: light.followPose,
          label: "Follow logo pose",
          onChange: fromPanel<boolean>((followPose) => onPoint(id, { followPose })),
        },
      };
      return schema;
    },
    true,
  );
  return null;
}

// Glass-on-photo palette so the panel sits inside the existing translucent aside.
const THEME = {
  colors: {
    elevation1: "transparent",
    elevation2: "rgba(255, 255, 255, 0.04)",
    elevation3: "rgba(255, 255, 255, 0.1)",
    accent1: "#ffffff",
    accent2: "rgba(255, 255, 255, 0.55)",
    accent3: "rgba(255, 255, 255, 0.4)",
    highlight1: "rgba(255, 255, 255, 0.55)",
    highlight2: "rgba(255, 255, 255, 0.9)",
    highlight3: "#ffffff",
  },
  sizes: { rootWidth: "100%", controlWidth: "9.5rem" },
  fontSizes: { root: "11px" },
};
