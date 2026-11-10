import { MeshTransmissionMaterial, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, type MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { RAIL_REM } from "@/components/layout/nav/rail";
import paths from "@/public/brand/fiu-logo-paths.json";

import { buildLogoGeometry, type LogoMeshMode, type LogoPaths } from "../buildLogoGeometry";
import type { LogoGlassParams } from "../config/schemas";
import { HERO_END, heroSpinAt, INTRO_END, MOBILE_TOSS, slideAt, spinAt, tossAt } from "./intro";
import { CAMERA_Z } from "./shared";

/** The side rail's width in CSS px (the notch inset can't be read from here). */
const RAIL_PX = RAIL_REM * 16;

/** Start the return spring once coasting has nearly stopped (not exactly 0). */
/** Floor for the interaction `weight` so a stray 0 can't divide by zero. */
const MIN_WEIGHT = 0.05;
const DRAG_VELOCITY_EPS = 0.08;
const DRAG_ANGLE_EPS = 0.0015;

/** Wrap to (-π, π] so return takes the shortest way home. */
function shortestAngle(radians: number) {
  const wrapped = ((((radians + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
}
export function Logo({
  readyRef,
  tint,
  onPose,
  meshMode,
  params,
  keepAwake,
  introSlide,
  introHold,
  introPlayed,
  onIntroEnd,
}: {
  /** Set by `useLogoQuality` once the shaders are warm and the tier is settled; the intro waits for it. */
  readyRef: MutableRefObject<boolean>;
  onIntroEnd: (() => void) | undefined;
  tint: MutableRefObject<THREE.Color>;
  onPose: (x: number, y: number) => void;
  meshMode: LogoMeshMode;
  params: LogoGlassParams;
  keepAwake: (seconds: number) => void;
  introSlide: boolean;
  introHold: boolean;
  introPlayed: boolean;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  // drei types MeshTransmissionMaterial's ref as its props shape, not MeshPhysicalMaterial.
  const material = useRef<ComponentRef<typeof MeshTransmissionMaterial>>(null);
  const hover = useRef({ active: false, x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const drag = useRef({
    active: false,
    returning: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
  });
  // A scene mounted after the intro already played starts where it ended: at rest, and never reports the end again.
  const intro = useRef(introSlide && introPlayed ? { time: HERO_END, ended: true } : { time: 0, ended: false });
  const introStats = useRef({ frames: 0, ms: 0, worst: 0, logged: false });
  const invalidate = useThree((s) => s.invalidate);
  const glow = useMemo(() => new THREE.Color(), []);
  const localPoint = useMemo(() => new THREE.Vector3(), []);
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  useCursor(hovered || dragging, dragging ? "grabbing" : "grab");

  const extrudeOverride = params.extrude;
  const depth = extrudeOverride?.depth;
  const bevelThickness = extrudeOverride?.bevelThickness;
  const bevelSize = extrudeOverride?.bevelSize;

  const geometry = useMemo(() => {
    const base = paths as unknown as LogoPaths;
    if (
      meshMode === "extrude"
      && base.extrude
      && depth !== undefined
      && bevelThickness !== undefined
      && bevelSize !== undefined
    ) {
      return buildLogoGeometry({ ...base, extrude: { ...base.extrude, depth, bevelThickness, bevelSize } }, meshMode);
    }
    return buildLogoGeometry(base, meshMode);
  }, [meshMode, depth, bevelThickness, bevelSize]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Width of the silhouette as the camera sees it, front-facing: the front of the slab sits nearer
  // the camera than z = 0, so its edges project slightly wider than the bounding box. Sizing by this
  // makes the glass logo the width of the flat SVG logo it replaces.
  const modelWidth = useMemo(() => {
    const pos = geometry.getAttribute("position");
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = (pos.getX(i) * CAMERA_Z) / (CAMERA_Z - pos.getZ(i));
      if (x < min) min = x;
      if (x > max) max = x;
    }
    return max - min;
  }, [geometry]);

  // Mirror the static layout: 42vw starting 2vw clear of the side rail on desktop (the gutter also
  // absorbs the glide's overshoot), centred at up to 80vw on mobile.
  const desktop = size.width >= 768;
  const targetWidth = desktop ? viewport.width * 0.42 : Math.min(viewport.width * 0.8, (viewport.width * 640) / size.width);
  const scale = targetWidth / modelWidth;
  const x = desktop ? -viewport.width / 2 + (RAIL_PX + size.width * 0.02) * (viewport.width / size.width) + targetWidth / 2 : 0;

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  // Nothing moves while the intro is held, so no frames are drawn then (beyond the quality probe's);
  // the release has to restart them.
  useEffect(() => {
    if (!introHold) invalidate();
  }, [introHold, invalidate]);

  // Redraw after mesh / material param changes without resetting intro spin state.
  useEffect(() => {
    invalidate();
  }, [geometry, params, invalidate]);

  // Drag continues on the window so rotation doesn't stop when the pointer leaves the mesh.
  useEffect(() => {
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      // Keep the demand loop alive through coast + bounce settle.
      keepAwake(8);
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      // The release was missed (e.g. the window lost focus mid-drag): end the drag instead of
      // letting the stale last position turn into one huge jump.
      if (e.buttons === 0 && e.pointerType === "mouse") {
        onUp();
        return;
      }
      const look = paramsRef.current;
      const pitchMax = look.dragPitchMax;
      // Heavier = less turn per pixel (the release velocity derives from the same deltas).
      const sens = look.dragSensitivity / Math.max(look.weight, MIN_WEIGHT);
      const now = performance.now();
      const dt = Math.max((now - d.lastT) / 1000, 1 / 120);
      const dX = (e.clientY - d.lastY) * sens;
      const dY = (e.clientX - d.lastX) * sens;
      d.rotX = THREE.MathUtils.clamp(d.rotX + dX, -pitchMax, pitchMax);
      d.rotY += dY;
      // Kill pitch momentum at the soft stop so coasting can't flip it vertical.
      if (Math.abs(d.rotX) >= pitchMax - 1e-4) d.velX = 0;
      // Exponential moving average of angular velocity (rad/s).
      const vx = dX / dt;
      const vy = dY / dt;
      d.velX = THREE.MathUtils.lerp(d.velX, vx, 0.45);
      d.velY = THREE.MathUtils.lerp(d.velY, vy, 0.45);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = now;
      keepAwake(1.2);
    };
    const onHidden = () => {
      if (document.hidden) onUp();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", onUp);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [keepAwake]);

  const setHoverFromPoint = (point: THREE.Vector3) => {
    const g = group.current;
    const box = geometry.boundingBox;
    if (!g || !box) return;
    localPoint.copy(point);
    g.worldToLocal(localPoint);
    const nx = THREE.MathUtils.clamp(((localPoint.x - box.min.x) / (box.max.x - box.min.x)) * 2 - 1, -1, 1);
    const ny = THREE.MathUtils.clamp(((localPoint.y - box.min.y) / (box.max.y - box.min.y)) * 2 - 1, -1, 1);
    hover.current.x = nx;
    hover.current.y = ny;
    hover.current.active = true;
  };

  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g) return;
    // rAF pauses in background tabs, so the first frame back can carry a delta of minutes; cap it
    // so drag coast and the return spring don't integrate that whole gap in one step.
    const delta = Math.min(rawDelta, 1 / 30);

    // Internal glow picks up the still temperature (like liquid-glass.jpg's warm core).
    const mat = material.current as (THREE.MeshPhysicalMaterial & { attenuationColor: THREE.Color }) | null;
    const look = paramsRef.current;
    if (mat?.attenuationColor) {
      glow.copy(tint.current);
      const hsl = { h: 0, s: 0, l: 0 };
      glow.getHSL(hsl);
      glow.setHSL(
        hsl.h,
        Math.min(0.85, hsl.s * look.glowSat),
        THREE.MathUtils.clamp(hsl.l + look.glowLift, look.glowLMin, look.glowLMax),
      );
      mat.attenuationColor.copy(glow);
    }

    // The first frames compile shaders and can stall for a long time, so the intro is
    // driven by capped frame deltas rather than wall-clock time: it always plays in full,
    // just slower on a struggling device. It (and the canvas reveal) waits for the quality probe.
    const a = intro.current;
    const ready = readyRef.current;
    if (ready && !introHold) a.time += delta;
    // The hero intro is shorter than the playground's Blender spin, so it ends (and stops
    // drawing) on its own clock.
    const introEnd = introSlide ? HERO_END : INTRO_END;
    if (a.time < introEnd && !introHold) invalidate();
    const t = a.time;
    if (introSlide && !a.ended && t >= introEnd) {
      a.ended = true;
      onIntroEnd?.();
    }

    // Dev only: how smooth the hero intro really is on this machine (GPU cost can't be seen in a
    // CPU profile). Logged once, when the intro ends.
    if (process.env.NODE_ENV !== "production" && introSlide && ready && !introHold) {
      const st = introStats.current;
      if (t < introEnd) {
        st.frames++;
        st.ms += rawDelta * 1000;
        st.worst = Math.max(st.worst, rawDelta * 1000);
      } else if (!st.logged && st.frames > 0) {
        st.logged = true;
        // One-off intro frame-rate readout.
        // eslint-disable-next-line no-console
        console.info(
          `[logo intro] ${st.frames} frames over ${(st.ms / 1000).toFixed(2)}s: `
            + `${((st.frames * 1000) / st.ms).toFixed(0)} fps avg, worst frame ${st.worst.toFixed(0)} ms`,
        );
      }
    }

    // Start centred and glide to the resting x; `x` is read fresh so resizes stay correct.
    const slide = introSlide ? slideAt(t) : 1;
    g.position.x = x * slide;
    g.position.y = introSlide && !desktop ? viewport.height * MOBILE_TOSS * tossAt(t) : 0;

    // Wobble only while hovering the logo (and not dragging); ease back to rest on leave.
    const weight = Math.max(look.weight, MIN_WEIGHT);
    const k = 1 - Math.exp((-delta * look.hoverLerp) / weight);
    const targetX = hover.current.active && !drag.current.active ? hover.current.y * look.hoverTiltX : 0;
    const targetY = hover.current.active && !drag.current.active ? hover.current.x * look.hoverTiltY : 0;
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, targetX, k);
    tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, targetY, k);

    const d = drag.current;
    if (!d.active) {
      // Latch return once coasting is nearly done — don't flip back when the bounce speeds up.
      if (!d.returning && Math.abs(d.velX) < DRAG_VELOCITY_EPS && Math.abs(d.velY) < DRAG_VELOCITY_EPS) {
        d.returning = true;
        d.velX = 0;
        d.velY = 0;
        // Don't unwind full turns — spring along the nearest angle to rest.
        d.rotX = shortestAngle(d.rotX);
        d.rotY = shortestAngle(d.rotY);
      }

      if (!d.returning) {
        d.rotX += d.velX * delta;
        d.rotY += d.velY * delta;
        const friction = Math.exp((-look.dragFriction / weight) * delta);
        d.velX *= friction;
        d.velY *= friction;
      } else {
        // Stiffness / mass and damping / sqrt(mass): the return slows as 1/sqrt(weight) but the
        // damping ratio (how much it overshoots) stays the same.
        const dampScale = 1 / Math.sqrt(weight);
        d.velX += ((-look.dragSpringPitch * d.rotX) / weight - look.dragSpringPitchDamp * dampScale * d.velX) * delta;
        d.velY += ((-look.dragSpring * d.rotY) / weight - look.dragSpringDamp * dampScale * d.velY) * delta;
        d.rotX += d.velX * delta;
        d.rotY += d.velY * delta;
        if (
          Math.abs(d.rotX) < DRAG_ANGLE_EPS
          && Math.abs(d.rotY) < DRAG_ANGLE_EPS
          && Math.abs(d.velX) < DRAG_VELOCITY_EPS
          && Math.abs(d.velY) < DRAG_VELOCITY_EPS
        ) {
          d.rotX = 0;
          d.rotY = 0;
          d.velX = 0;
          d.velY = 0;
          d.returning = false;
        }
      }
      const pitchMax = paramsRef.current.dragPitchMax;
      if (Math.abs(d.rotX) > pitchMax) {
        d.rotX = THREE.MathUtils.clamp(d.rotX, -pitchMax, pitchMax);
        d.velX = 0;
      }
      if (d.velX || d.velY || d.rotX || d.rotY || d.returning) invalidate();
    }

    g.rotation.set(tilt.current.x + d.rotX, (introSlide ? heroSpinAt(t) : spinAt(t)) + tilt.current.y + d.rotY, 0);
    onPose(g.rotation.x, g.rotation.y);
  });

  return (
    <group ref={group} position={[x, 0, 0]} scale={scale}>
      <mesh
        ref={mesh}
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoverFromPoint(e.point);
          keepAwake(1.2);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (drag.current.active) return;
          setHoverFromPoint(e.point);
          keepAwake(1.2);
        }}
        onPointerOut={() => {
          hover.current.active = false;
          setHovered(false);
          keepAwake(0.6);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const { clientX, clientY } = e.nativeEvent;
          const d = drag.current;
          d.active = true;
          d.returning = false;
          d.lastX = clientX;
          d.lastY = clientY;
          d.lastT = performance.now();
          d.velX = 0;
          d.velY = 0;
          hover.current.active = false;
          setDragging(true);
          setHovered(true);
          keepAwake(2);
        }}
      >
        <MeshTransmissionMaterial
          ref={material}
          // Banding fix stays (blur + dither); CA / env / tint restored for color.
          samples={params.samples}
          // No `resolution`: drei then sizes the transmission buffers to the canvas (with its
          // pixel ratio). A number makes them square, which squashes the wide viewport into it and
          // leaves horizontal detail well under one buffer pixel per screen pixel on desktop.
          backside={params.backside}
          backsideEnvMapIntensity={params.backsideEnvMapIntensity}
          dithering
          backsideThickness={params.backsideThickness}
          thickness={params.thickness}
          ior={params.ior}
          chromaticAberration={params.chromaticAberration}
          anisotropicBlur={params.anisotropicBlur}
          distortion={params.distortion}
          distortionScale={params.distortionScale}
          temporalDistortion={0}
          roughness={params.roughness}
          clearcoat={params.clearcoat}
          clearcoatRoughness={params.clearcoatRoughness}
          specularIntensity={params.specularIntensity}
          envMapIntensity={params.envMapIntensity}
          color="#ffffff"
          attenuationColor="#fff6f0"
          attenuationDistance={params.attenuationDistance}
        />
      </mesh>
    </group>
  );
}
