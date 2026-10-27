"""Export `public/brand/fiu-logo-paths.json` for the procedural Three.js logo.

Authority: design/refs/white.png for everything — stroke centrelines + radii (via
02b_from_white.py), the extrude silhouettes (incl. true needle tips), and the two dots.

Usage:
  python scripts/logo/02b_from_white.py design/refs/white.png /tmp/fiu-logo
  python scripts/logo/06_paths_for_three.py [/tmp/fiu-logo] [public/brand/fiu-logo-paths.json]

Extrude mode: three's ExtrudeGeometry pushes the side walls *outward* by `bevelSize`, and
clamps that push to length √2 at corners sharper than 90° (so needle tips come out blunt
and short). We therefore emit each shape pre-inset by its bevel and nudge every sharp tip
vertex so that the outward push lands exactly on the white.png apex.
"""

from __future__ import annotations

import json
import math
import os
import sys

import numpy as np
from matplotlib.path import Path as MplPath
from PIL import Image
from scipy import ndimage
from skimage.measure import approximate_polygon, find_contours, label, regionprops

work = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fiu-logo"
out_path = sys.argv[2] if len(sys.argv) > 2 else "public/brand/fiu-logo-paths.json"
LOGO_WIDTH = 13.4

white = np.asarray(Image.open("design/refs/white.png").convert("RGBA"))
al = white[..., 3].astype(float) / 255.0
alpha = white[..., 3] > 128
Hw, Ww = alpha.shape
S = LOGO_WIDTH / Ww  # world units per px
lab = label(alpha)
props = sorted(regionprops(lab), key=lambda p: -p.area)
f0 = props[0]
diamonds_p = sorted(
    [p for p in props if p.area < f0.area * 0.08 and p.centroid[0] < Hw * 0.45],
    key=lambda p: p.centroid[1],
)[:2]
dlabels = {p.label for p in diamonds_p}
body_props = [p for p in props if p.label not in dlabels and p.area >= 80]


def px_to_world(col, row, H=Hw, W=Ww):
    return np.array([float(col) * LOGO_WIDTH / W, float(H - row) * LOGO_WIDTH / W])


def xy_px_to_world(xy):
    """(N, 2) of (col, row) px → world, y up."""
    return np.stack([xy[:, 0] * S, (Hw - xy[:, 1]) * S], 1)


def shoelace(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def tip_silhouette(fmask, diamond_centroid, H):
    """Flat tip segment of the f next to the first diamond (image y-down)."""
    cy, cx = diamond_centroid
    edge = []
    for y in range(max(0, int(cy) - 80), min(H, int(cy) + 50)):
        xs = np.where(fmask[y])[0]
        if len(xs) and xs.max() < cx - 2:
            edge.append((float(xs.max()), float(y)))
    edge = np.asarray(edge)
    if len(edge) < 6:
        raise SystemExit("could not find f tip silhouette")
    xmax_i = int(np.argmax(edge[:, 0]))

    def walk(start, step):
        seg = [start]
        i = start
        while 0 <= i + step < len(edge):
            i += step
            if edge[i, 0] < edge[start, 0] - 10:
                break
            seg.append(i)
            if len(seg) > 50:
                break
        return seg

    seg = edge[sorted(set(walk(xmax_i, -1) + walk(xmax_i, 1)))]
    c = seg.mean(0)
    _, _, vh = np.linalg.svd(seg - c)
    direction = vh[0]
    proj = (seg - c) @ direction
    a = seg[int(np.argmin(proj))]
    b = seg[int(np.argmax(proj))]
    ang = float(np.arctan2(-(b[1] - a[1]), b[0] - a[0]))  # y-up angle
    mid = (a + b) / 2
    length = float(np.linalg.norm(b - a))
    return mid, ang, length


# --- Geometry helpers ----------------------------------------------------------
SQRT2 = math.sqrt(2.0)
UP = 4  # sdf supersampling: geometry below works in UP× pixel units
STEP = 0.5 * UP  # arclength resampling for tip detection


def resample_closed(xy, step=STEP):
    pts = np.vstack([xy, xy[0]]) if np.linalg.norm(xy[0] - xy[-1]) > 1e-9 else xy
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    t = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(t[-1] / step), 16)
    ts = np.linspace(0, t[-1], n, endpoint=False)
    return np.stack([np.interp(ts, t, pts[:, 0]), np.interp(ts, t, pts[:, 1])], 1)


def fit_line(pts):
    c = pts.mean(0)
    _, _, vh = np.linalg.svd(pts - c)
    return c, vh[0]


def apex_of_arms(arm_a, arm_b):
    """Intersect the lines through two point runs → (apex, interior angle, outward unit)."""
    ca, ea = fit_line(arm_a)
    cb, eb = fit_line(arm_b)
    m = np.array([ea, -eb]).T
    if abs(np.linalg.det(m)) < 1e-6:
        return None
    t = np.linalg.solve(m, cb - ca)
    apex = ca + ea * t[0]
    ea = ea if np.dot(ca - apex, ea) > 0 else -ea  # point away from the apex, into the shape
    eb = eb if np.dot(cb - apex, eb) > 0 else -eb
    ang = math.acos(float(np.clip(np.dot(ea, eb), -1, 1)))
    u = -(ea + eb)
    n = np.linalg.norm(u)
    if n < 1e-9:
        return None
    return apex, ang, u / n


def tip_nudge(ang, d):
    """How far *toward* the tip to push an inset apex so three's clamped offset lands on it.

    Ideal mitre length for a corner of interior angle `ang` is d / sin(ang/2); three caps the
    push at √2·d, so the inset vertex has to sit that much further forward.
    """
    L = 1.0 / math.sin(ang / 2)
    return d * (L - min(L, SQRT2))


def find_white_apex(start, heading, sdf, max_len=400.0 * UP):
    """Walk the stroke ridge (max of sdf across the heading) from `start` out to the white tip."""
    def at(q):
        return float(ndimage.map_coordinates(sdf, [[q[1]], [q[0]]], order=1)[0])

    p = np.asarray(start, float)
    h = np.asarray(heading, float)
    h /= np.linalg.norm(h)
    last = p
    path = [p]
    for _ in range(int(max_len / STEP)):
        q = p + h * STEP
        perp = np.array([-h[1], h[0]])
        best = max((at(q + perp * dl * UP), dl) for dl in (-1.0, -0.5, 0.0, 0.5, 1.0))
        q = q + perp * best[1] * STEP
        if at(q) < 0.5 * UP:
            break
        step = q - p
        h = 0.8 * h + 0.2 * step / (np.linalg.norm(step) + 1e-9)
        h /= np.linalg.norm(h)
        p, last = q, q
        path.append(q)
    return last, h, np.array(path)


def fix_sharp_tips(ring_px, d_px, sdf, max_angle=math.radians(88)):
    """Pre-compensate sharp (< 90°) convex tips of an inset ring (px, y-down)."""
    pts = resample_closed(ring_px)
    n = len(pts)
    w = max(int(3 * d_px / STEP), 8)
    k1 = max(int(1.5 * d_px / STEP), 2)
    k2 = max(int(4.5 * d_px / STEP), k1 + 4)
    def interior(i, off):
        a, b, p = pts[(i - off) % n], pts[(i + off) % n], pts[i]
        v1, v2 = a - p, b - p
        return math.acos(
            float(np.clip(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9), -1, 1))
        )

    # A true tip is just as sharp over a short and a long window; a tight curve is not.
    ws = max(int(1.5 * d_px / STEP), 3)
    ang = np.array([interior(i, w) for i in range(n)])
    ang_s = np.array([interior(i, ws) for i in range(n)])
    cand = [
        i for i in range(n)
        if ang[i] < math.radians(100) and ang_s[i] < math.radians(100) and ang[i] - ang_s[i] < math.radians(20)
    ]
    cand.sort(key=lambda i: ang[i])
    picked = []
    for i in cand:
        if all(min(abs(i - j), n - abs(i - j)) > 2 * k2 for j, _ in picked):
            if ang[i] <= min(ang[(i + o) % n] for o in range(-w, w + 1)) + 1e-9:
                picked.append((i, ang[i]))
    removed = {}
    inserts = {}
    tips = []
    for i, _ in picked:
        arm_a = np.array([pts[(i - m) % n] for m in range(k1, k2)])
        arm_b = np.array([pts[(i + m) % n] for m in range(k1, k2)])
        res = apex_of_arms(arm_a, arm_b)
        if res is None:
            continue
        apex, a_ang, u = res
        if a_ang >= max_angle:
            continue
        # Only convex tips of the shape: the wedge interior must be inside the inset shape.
        probe = pts[i] - u * 3.0 * UP
        if ndimage.map_coordinates(sdf, [[probe[1]], [probe[0]]], order=1)[0] < d_px - 0.75 * UP:
            continue
        # Walk out to the real white.png apex, then back off by the √2·d three will add.
        apex_w, h_end, ridge = find_white_apex(pts[i], u, sdf)
        # A needle that curves can't be followed by the single tip vertex (any extra vertex would
        # be pushed a full bevel past the artwork edge), so the wall runs straight from the arm to
        # the apex. Record how far the real ridge strays from that chord (px).
        chord = apex_w - pts[i]
        n_c = chord / (np.linalg.norm(chord) + 1e-9)
        rel = ridge - pts[i]
        sag = float(np.abs(rel[:, 0] * n_c[1] - rel[:, 1] * n_c[0]).max()) / UP
        q = apex_w - h_end * SQRT2 * d_px
        idx = [(i + m) % n for m in range(-k1, k1 + 1)]
        for j in idx:
            removed[j] = i
        inserts[i] = (idx, q)
        tips.append((apex_w, float(np.linalg.norm(apex_w - pts[i])), sag))
        print(f"    tip at px {pts[i].round(1)} interior {math.degrees(a_ang):.0f}° → white apex {apex_w.round(1)}")
    if not inserts:
        return pts, tips
    out, done = [], set()
    for j in range(n):
        if j in removed:
            t = removed[j]
            if t not in done:
                out.append(inserts[t][1])
                done.add(t)
            continue
        out.append(pts[j])
    return np.array(out), tips


def simplify_ring(ring_px, tol_px=0.4 * UP):
    closed = np.vstack([ring_px, ring_px[0]])
    simp = approximate_polygon(closed, tol_px)
    return simp[:-1]


def nest_rings(rings_world):
    """Group rings into [(outer, [holes])] by containment depth."""
    order = sorted(range(len(rings_world)), key=lambda i: -shoelace(rings_world[i]))
    depth = {}
    parent = {}
    for pos, i in enumerate(order):
        depth[i] = 0
        parent[i] = None
        for j in order[:pos]:
            if MplPath(rings_world[j]).contains_point(rings_world[i][0]):
                if depth[j] + 1 > depth[i]:
                    depth[i] = depth[j] + 1
                    parent[i] = j
    shapes = {}
    for i in order:
        if depth[i] % 2 == 0:
            shapes[i] = (rings_world[i], [])
    for i in order:
        if depth[i] % 2 == 1:
            root = parent[i]
            if root in shapes:
                shapes[root][1].append(rings_world[i])
    return list(shapes.values())


def inset_convex(poly, d):
    """Inset a small convex polygon by d with three's √2 corner clamp pre-compensated."""
    p = np.asarray(poly, float)
    n = len(p)
    sgn = 1.0 if shoelace_signed(p) > 0 else -1.0
    lines = []
    for i in range(n):
        a, b = p[i], p[(i + 1) % n]
        e = (b - a) / np.linalg.norm(b - a)
        nrm = sgn * np.array([-e[1], e[0]])  # inward
        lines.append((a + nrm * d, e))
    out = []
    for i in range(n):
        (pa, ea), (pb, eb) = lines[i - 1], lines[i]
        m = np.array([ea, -eb]).T
        t = np.linalg.solve(m, pb - pa)
        q = pa + ea * t[0]
        v1 = p[i - 1] - p[i]
        v2 = p[(i + 1) % n] - p[i]
        ang = math.acos(float(np.clip(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)), -1, 1)))
        u = -(v1 / np.linalg.norm(v1) + v2 / np.linalg.norm(v2))
        u /= np.linalg.norm(u)
        out.append(q + u * tip_nudge(ang, d))
    return np.array(out)


def shoelace_signed(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * (np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


# --- Extrude silhouettes from white.png ---------------------------------------
# Each shape is inset by its own bevel d (thin strokes get a smaller one) so that
# three's outward bevel offset reproduces the white.png outline, tips included.
BEVEL_MAX = 0.09
PAD = 8


def big_to_world(xy_big, off):
    """Supersampled (x, y) px (+ crop offset) → world."""
    xy = (xy_big + off + 0.5) / UP - 0.5
    return xy_px_to_world(xy)


shapes_payload = []
outline_pts = []  # white outlines, for centring only
for p in body_props:
    comp = lab == p.label
    for c in find_contours(al * ndimage.binary_dilation(comp, iterations=1), 0.5):
        outline_pts.append(xy_px_to_world(c[:, ::-1]))
    # Signed distance from the *anti-aliased* alpha, supersampled and lightly smoothed, so
    # the inset rings follow the artwork's curves instead of its pixel staircase.
    r0, c0, r1, c1 = p.bbox
    r0, c0 = max(r0 - PAD, 0), max(c0 - PAD, 0)
    r1, c1 = min(r1 + PAD, Hw), min(c1 + PAD, Ww)
    a_c = (al * ndimage.binary_dilation(comp, iterations=2))[r0:r1, c0:c1]
    big = np.clip(ndimage.zoom(a_c, UP, order=3, grid_mode=True, mode="nearest"), 0, 1) > 0.5
    sdf = ndimage.distance_transform_edt(big) - ndimage.distance_transform_edt(~big)
    sdf = ndimage.gaussian_filter(sdf, 0.45 * UP)
    off = np.array([c0 * UP, r0 * UP], float)
    rmax_world = float(sdf.max()) / UP * S
    d = min(BEVEL_MAX, 0.5 * rmax_world)
    # Never erode far enough to break a thin sliver (e.g. the f bowl) or add rings.
    n_ref = len([c for c in find_contours(sdf, 1.0 * UP) if len(c) >= 12 * UP])
    while d > 0.02 and len([c for c in find_contours(sdf, d / S * UP) if len(c) >= 12 * UP]) != n_ref:
        d -= 0.25 * S
    def build_rings(d):
        d_px = d / S * UP
        rings, tips_world, sags = [], [], []
        for c in find_contours(sdf, d_px):
            if len(c) < 12 * UP:
                continue
            ring, tips = fix_sharp_tips(c[:, ::-1], d_px, sdf)
            ring = simplify_ring(ring)
            w = big_to_world(ring, off)
            if shoelace(w) > 1e-4:
                rings.append(w)
            for apex, dist, sag in tips:
                tips_world.append([*big_to_world(apex[None], off)[0], dist / UP * S + 2 * d])
                sags.append(sag)
        return rings, tips_world, sags

    # Curved needles are approximated by a straight chord; shrink the bevel (and with it the
    # needle section the chord has to cover) until the chord stays within SAG_MAX px of the art.
    SAG_MAX = 1.5
    while True:
        rings, tips_world, sags = build_rings(d)
        if not sags or max(sags) <= SAG_MAX or d <= 0.025:
            break
        d = max(d * 0.85, 0.025)
    print(f"shape label={p.label} area={p.area:.0f} bevel={d:.3f} tip sag px={[round(x, 1) for x in sags]}")
    # True white outline (sdf = 0) near each tip, for the TS depth taper.
    outline = []
    for c in find_contours(sdf, 0.0):
        if len(c) < 12 * UP:
            continue
        outline.append(big_to_world(simplify_ring(c[:, ::-1], 0.3 * UP), off))
    for outer, holes in nest_rings(rings):
        shapes_payload.append(
            {
                "outer": outer,
                "holes": holes,
                "bevel": round(d, 4),
                "tips": tips_world,
                "outline": outline,
            }
        )

# --- Tip cut from white + side length from strokes tube radius ----------------
strokes = json.load(open(os.path.join(work, "strokes.json")))
tip_pt = max(strokes["strokes"], key=lambda s: len(s["points"]))["points"][-1]
tip_side = 2.0 * float(tip_pt[2])
tip_mid_px, tip_ang_white, _ = tip_silhouette(lab == f0.label, diamonds_p[0].centroid, Hw)
# Prefer the stored sheared tip_cut angle when present (same measurement path).
tip_ang = float(strokes.get("tip_cut", {}).get("angle", tip_ang_white))

# --- Dots: exact white.png parallelograms ----------------------------------------
def dot_corners_px(p):
    """Sharp corners of a dot: fit a line to each edge of the sub-pixel outline, intersect."""
    comp = lab == p.label
    c = max(find_contours(al * ndimage.binary_dilation(comp, iterations=1), 0.5), key=len)
    xy = c[:, ::-1]
    for tol in (2.0, 3.0, 4.0, 5.0, 6.0, 8.0):
        simp = approximate_polygon(np.vstack([xy, xy[0]]), tol)[:-1]
        if len(simp) == 4:
            break
    else:
        raise SystemExit(f"dot {p.label}: expected 4 corners, got {len(simp)}")
    # dense indices of each simplified vertex
    idx = [int(np.argmin(np.linalg.norm(xy - v, axis=1))) for v in simp]
    lines = []
    for k in range(4):
        i0, i1 = idx[k], idx[(k + 1) % 4]
        if i1 < i0:
            i1 += len(xy)
        seg = np.array([xy[j % len(xy)] for j in range(i0, i1 + 1)])
        trim = max(int(0.2 * len(seg)), 1)
        lines.append(fit_line(seg[trim:-trim]))
    corners = []
    for k in range(4):
        (ca, ea), (cb, eb) = lines[k - 1], lines[k]
        t = np.linalg.solve(np.array([ea, -eb]).T, cb - ca)
        corners.append(ca + ea * t[0])
    return np.array(corners)


DIAMOND_DEPTH = 0.15
DIAMOND_BEVEL = 0.065
dot_world = [xy_px_to_world(dot_corners_px(p)) for p in diamonds_p]
sides = [
    sorted(np.linalg.norm(np.roll(w, -1, 0) - w, axis=1)) for w in dot_world
]
LONG_RATIO = float(np.mean([s[-1] / s[0] for s in sides]))
dot_world = [inset_convex(w, DIAMOND_BEVEL) for w in dot_world]
for p, w in zip(diamonds_p, dot_world):
    print(f"dot px centroid=({p.centroid[1]:.1f},{p.centroid[0]:.1f}) inset ring={w.round(3).tolist()}")

# Center on the body only so diamond tweaks don't shift the mark vs the PNG.
body_pts = np.vstack(outline_pts)
cx = float((body_pts[:, 0].min() + body_pts[:, 0].max()) / 2)
cy = float((body_pts[:, 1].min() + body_pts[:, 1].max()) / 2)


def recenter(pts, nd=4):
    return [[round(float(x - cx), nd), round(float(y - cy), nd)] for x, y in pts]


# --- Variable-radius strokes (live tube mesh) ---------------------------------------
# The skeleton stops short of the real end (a half-width for flat cuts, a few px for
# needle tips). Extend each end along its tangent out to the white.png silhouette.
dist_px = ndimage.distance_transform_edt(alpha)
comp_for_stroke = {}
for si, s in enumerate(strokes["strokes"]):
    pts = np.array(s["points"])
    mid = pts[len(pts) // 2]
    px, py = int(round(mid[0] / S)), int(round(Hw - mid[1] / S))
    comp_for_stroke[si] = int(lab[py, px]) or int(lab[max(py - 3, 0): py + 4, max(px - 3, 0): px + 4].max())


def extend_end(pts, si, at_end, cap):
    """Return pts with the chosen end extended to the white silhouette (raw world frame)."""
    pts = [list(map(float, q)) for q in pts]
    i_end, i_prev = (-1, -4) if at_end else (0, 3)
    p = np.array(pts[i_end][:2])
    t = p - np.array(pts[i_prev][:2])
    t /= np.linalg.norm(t)
    pxy = np.array([p[0] / S, Hw - p[1] / S])
    tpx = np.array([t[0], -t[1]])
    ys, xs = np.nonzero(lab == comp_for_stroke[si])
    rel = np.stack([xs, ys], 1) - pxy
    along = rel @ tpx
    perp = np.abs(rel @ np.array([-tpx[1], tpx[0]]))
    near = (along > 0) & (along < 60) & (perp < 3.0)
    if not near.any():
        return pts
    over = float(along[near].max()) * S
    r_end = float(pts[i_end][2])
    if cap == "point":
        hw = float(dist_px[int(round(pxy[1])), int(round(pxy[0]))]) * S
        r_old, r_new = max(r_end, hw), 0.0001
    else:
        r_old, r_new = r_end, r_end
    steps = max(int(over / 0.04), 2)
    ext = [
        [p[0] + t[0] * over * k / steps, p[1] + t[1] * over * k / steps,
         r_old + (r_new - r_old) * k / steps]
        for k in range(1, steps + 1)
    ]
    print(f"    stroke{si} {'end' if at_end else 'start'} ({cap}) extended {over / S:.1f}px")
    if at_end:
        pts[-1][2] = r_old
        return pts + ext
    pts[0][2] = r_old
    return ext[::-1] + pts


stroke_payload = []
for si, s in enumerate(strokes["strokes"]):
    caps = list(s.get("caps", ["flat", "flat"]))
    pts = s["points"]
    if not s.get("closed", False):
        pts = extend_end(pts, si, False, caps[0])
        pts = extend_end(pts, si, True, caps[-1])
    stroke_payload.append(
        {
            "points": [[round(float(x - cx), 4), round(float(y - cy), 4), round(float(r), 4)] for x, y, r in pts],
            "closed": bool(s.get("closed", False)),
            "caps": caps,
        }
    )

shapes_out = [
    {
        "outer": recenter(s["outer"]),
        "holes": [recenter(h) for h in s["holes"]],
        "bevel": s["bevel"],
        "tips": [[round(float(x - cx), 4), round(float(y - cy), 4), round(float(r), 4)] for x, y, r in s["tips"]],
        "outline": [recenter(o, 3) for o in s["outline"]],
    }
    for s in shapes_payload
]
diamonds_out = [np.array(recenter(w), float) for w in dot_world]
for i, dm in enumerate(diamonds_out):
    print(f"diamond{i} center={dm.mean(0).round(3)}")

payload = {
    "units": "logo-world, y-up, centered at origin",
    # Round tubes: local depth ≈ 2r along each centreline (liquid-glass).
    "strokes": stroke_payload,
    # Flat silhouette extrude — deep rounded fillet (liquid-glass pillow edge). Shapes are
    # pre-inset by their own `bevel`; the extrude pushes the walls back out to white.png.
    "extrude": {
        "depth": 0.30,
        "bevelThickness": 0.09,
        "bevelSize": 0.09,
        "bevelSegments": 6,
    },
    "shapes": shapes_out,
    "diamonds": [
        {
            "corners": [[round(float(x), 4), round(float(y), 4)] for x, y in d],
            "depth": DIAMOND_DEPTH,
            "bevel": DIAMOND_BEVEL,
        }
        for d in diamonds_out
    ],
    "tipCut": {
        "angle": tip_ang,
        "side": float(tip_side),
        "longRatio": LONG_RATIO,
    },
}
os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
json.dump(payload, open(out_path, "w"), indent=2)
r_stats = [
    (min(p[2] for p in s["points"]), max(p[2] for p in s["points"])) for s in stroke_payload
]
print(
    f"wrote {out_path}: {len(stroke_payload)} strokes "
    + ", ".join(f"r[{a:.3f}-{b:.3f}]" for a, b in r_stats)
    + f", {len(payload['shapes'])} shapes, {len(payload['diamonds'])} diamonds, "
    f"tip {np.degrees(tip_ang):.1f}°"
)
