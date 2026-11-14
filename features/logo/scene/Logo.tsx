import { useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { RAIL_REM } from "@/lib/rail";

import type { LogoMeshMode } from "../buildLogoGeometry";
import type { LogoGlassParams } from "../config/schemas";
import { GlassMaterial, type GlassMaterialRef } from "./GlassMaterial";
import { HERO_END, heroSpinAt, INTRO_END, MOBILE_TOSS, slideAt, spinAt, tossAt } from "./intro";
import {
  followHover,
  type HoverState,
  type IntroStats,
  logIntroFrame,
  MIN_WEIGHT,
  newDragState,
  stepDrag,
  tintGlow,
} from "./logoMotion";
import { useLogoGeometry } from "./useLogoGeometry";
import { useWindowDrag } from "./useWindowDrag";

/** The side rail's width in CSS px (the notch inset can't be read from here). */
const RAIL_PX = RAIL_REM * 16;

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
  readyRef: RefObject<boolean>;
  onIntroEnd: (() => void) | undefined;
  tint: RefObject<THREE.Color>;
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
  const material = useRef<GlassMaterialRef>(null);
  const hover = useRef<HoverState>({ active: false, x: 0, y: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const drag = useRef(newDragState());
  // A scene mounted after the intro already played starts where it ended: at rest, and never reports the end again.
  const intro = useRef(introSlide && introPlayed ? { time: HERO_END, ended: true } : { time: 0, ended: false });
  const introStats = useRef<IntroStats>({ frames: 0, ms: 0, worst: 0, logged: false });
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

  const { geometry, modelWidth } = useLogoGeometry(meshMode, params.extrude);

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

  useWindowDrag(drag, paramsRef, keepAwake, setDragging);

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
    const look = paramsRef.current;
    tintGlow(material.current, glow, tint.current, look);

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
    if (introSlide && ready && !introHold) logIntroFrame(introStats.current, rawDelta, t, introEnd);

    // Start centred and glide to the resting x; `x` is read fresh so resizes stay correct.
    const slide = introSlide ? slideAt(t) : 1;
    g.position.x = x * slide;
    g.position.y = introSlide && !desktop ? viewport.height * MOBILE_TOSS * tossAt(t) : 0;

    // Wobble only while hovering the logo (and not dragging); ease back to rest on leave.
    const weight = Math.max(look.weight, MIN_WEIGHT);
    followHover(tilt.current, hover.current, drag.current.active, look, weight, delta);
    if (stepDrag(drag.current, look, weight, delta)) invalidate();

    const d = drag.current;
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
        <GlassMaterial ref={material} params={params} />
      </mesh>
    </group>
  );
}
