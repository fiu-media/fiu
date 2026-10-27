"""Export `public/brand/fiu-logo-paths.json` for the procedural Three.js logo.

Authority:
  - Body silhouette / holes / crescent: design/refs/white.png
  - Diamond size ratio + tip-relative placement: design/refs/liquid-glass.jpg
  - Tip-cut angle (sheared): measured from white.png next to the first diamond

Usage:
  python scripts/logo/02b_from_white.py design/refs/white.png /tmp/fiu-logo
  python scripts/logo/06_paths_for_three.py [/tmp/fiu-logo] [public/brand/fiu-logo-paths.json]
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
from matplotlib.path import Path as MplPath
from PIL import Image
from scipy import ndimage
from skimage.color import rgb2lab
from skimage.measure import find_contours, label, regionprops
from skimage.morphology import (
    binary_closing,
    binary_erosion,
    disk,
    remove_small_holes,
    remove_small_objects,
)

work = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fiu-logo"
out_path = sys.argv[2] if len(sys.argv) > 2 else "public/brand/fiu-logo-paths.json"
LOGO_WIDTH = 13.4

white = np.asarray(Image.open("design/refs/white.png").convert("RGBA"))
alpha = white[..., 3] > 128
Hw, Ww = alpha.shape
lab = label(alpha)
props = sorted(regionprops(lab), key=lambda p: -p.area)
f0 = props[0]
diamonds_p = sorted(
    [p for p in props if p.area < f0.area * 0.08 and p.centroid[0] < Hw * 0.45],
    key=lambda p: p.centroid[1],
)[:2]
dlabels = {p.label for p in diamonds_p}


def px_to_world(col, row, H=Hw, W=Ww):
    return np.array([float(col) * LOGO_WIDTH / W, float(H - row) * LOGO_WIDTH / W])


def contour_world(cont, step=0.07):
    pts = np.array([px_to_world(c, r) for r, c in cont])
    if np.linalg.norm(pts[0] - pts[-1]) > 1e-6:
        pts = np.vstack([pts, pts[0]])
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    length = float(seg.sum())
    if length < 0.2:
        return None
    t = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(length / step), 12)
    ts = np.linspace(0, length, n, endpoint=False)
    return np.stack([np.interp(ts, t, pts[:, 0]), np.interp(ts, t, pts[:, 1])], 1)


def shoelace(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def corners4(comp):
    boundary = comp & ~binary_erosion(comp)
    by, bx = np.where(boundary)
    bpts = np.stack([bx, by], 1).astype(float)
    c = bpts.mean(0)
    grid = np.linspace(0, 2 * np.pi, 720, endpoint=False)
    arg = np.array([np.argmax((bpts - c) @ np.array([np.cos(a), np.sin(a)])) for a in grid])
    rad = np.array([((bpts - c) @ np.array([np.cos(a), np.sin(a)])).max() for a in grid])
    loc = [i for i in range(720) if rad[i] >= rad[i - 1] and rad[i] >= rad[(i + 1) % 720]]
    loc = sorted(loc, key=lambda i: -rad[i])
    pick = []
    for i in loc:
        if all(min(abs(i - j), 720 - abs(i - j)) >= 50 for j in pick):
            pick.append(i)
        if len(pick) == 4:
            break
    corners = np.array([bpts[arg[i]] for i in sorted(pick)])
    ang = np.arctan2(corners[:, 1] - c[1], corners[:, 0] - c[0])
    return c, corners[np.argsort(ang)]


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
    # y-up angle
    ang = float(np.arctan2(-(b[1] - a[1]), b[0] - a[0]))
    mid = (a + b) / 2
    length = float(np.linalg.norm(b - a))
    return mid, ang, length


# --- Body shapes from white.png ------------------------------------------------
shapes = []
for p in props:
    if p.label in dlabels or p.area < 80:
        continue
    comp_s = ndimage.gaussian_filter((lab == p.label).astype(float), 0.5) > 0.45
    conts = []
    for c in find_contours(comp_s.astype(float), 0.5):
        w = contour_world(c)
        if w is not None:
            conts.append(w)
    if not conts:
        continue
    areas = [shoelace(c) for c in conts]
    outer_i = int(np.argmax(areas))
    outer = conts[outer_i]
    holes = [
        c
        for i, c in enumerate(conts)
        if i != outer_i and MplPath(outer).contains_point(c.mean(0))
    ]
    shapes.append({"outer": outer, "holes": holes, "area": areas[outer_i]})

shapes.sort(key=lambda s: -s["area"])

# --- Tip cut from white + side length from strokes tube radius ----------------
strokes = json.load(open(os.path.join(work, "strokes.json")))
tip_pt = max(strokes["strokes"], key=lambda s: len(s["points"]))["points"][-1]
tip_side = 2.0 * float(tip_pt[2])
tip_mid_px, tip_ang_white, _ = tip_silhouette(lab == f0.label, diamonds_p[0].centroid, Hw)
# Prefer the stored sheared tip_cut angle when present (same measurement path).
tip_ang = float(strokes.get("tip_cut", {}).get("angle", tip_ang_white))
tip_xy = px_to_world(tip_mid_px[0], tip_mid_px[1])

# --- Exact diamond layout from liquid-glass.jpg (tip-relative) ----------------
im = np.asarray(Image.open("design/refs/liquid-glass.jpg").convert("RGB")).astype(float) / 255
labc = rgb2lab(im)
L, a_ch, b_ch = labc[..., 0], labc[..., 1], labc[..., 2]
Hg, Wg = im.shape[:2]
yy, xx = np.mgrid[:Hg, :Wg]
roi = ((xx - Wg * 0.47) / (Wg * 0.38)) ** 2 + ((yy - Hg * 0.5) / (Hg * 0.38)) ** 2 < 1
bg_a = np.median(a_ch[roi & (L < 25)])
glass = roi & ((L > 55) | ((L > 28) & (a_ch < bg_a - 8)) | ((L > 35) & (b_ch > 20)))
glass = binary_closing(glass, disk(3))
glass = remove_small_objects(glass, 40)
glass = remove_small_holes(glass, 80)
labg = label(glass)
propsg = sorted(regionprops(labg), key=lambda p: -p.area)
f_lg = propsg[0]
diam_lg = sorted(
    [p for p in propsg if p.area < f_lg.area * 0.12 and p.centroid[0] < Hg * 0.42],
    key=lambda p: p.centroid[1],
)[:2]
if len(diam_lg) < 2:
    raise SystemExit("liquid-glass: expected 2 diamond components")

tip_mid_lg, _, _ = tip_silhouette(labg == f_lg.label, diam_lg[0].centroid, Hg)

lg_centers_px = []
lg_shorts = []
lg_longs = []
for p in diam_lg:
    c, corners = corners4(labg == p.label)
    lg_centers_px.append(c)
    sides = [float(np.linalg.norm(corners[(j + 1) % 4] - corners[j])) for j in range(4)]
    lg_shorts.append(min(sides))
    lg_longs.append(max(sides))

short_px = float(np.mean(lg_shorts))
long_px = float(np.mean(lg_longs))
LONG_RATIO = long_px / short_px
# Scale liquid-glass pixels so the short diamond side = f tip diameter.
scale = tip_side / short_px


def lg_rel_world(col, row):
    # Relative to tip mid, y-up, in logo-world units.
    return np.array([(col - tip_mid_lg[0]) * scale, -(row - tip_mid_lg[1]) * scale])

# Pull slightly closer than raw LG centroids — mark reads tighter on the home hero.
PROXIMITY = 0.88
d_centers = [tip_xy + PROXIMITY * lg_rel_world(c[0], c[1]) for c in lg_centers_px]
short_ang = tip_ang  # white tip cut is the alignment authority
# Acute angle between short (tip) and long sides ≈ white / liquid-glass.
acute = np.radians(73.0)

print(
    f"tip world={tip_xy.round(3)} ang={np.degrees(tip_ang):.1f}° side={tip_side:.3f}\n"
    f"LG scale={scale:.5f} long/short={LONG_RATIO:.3f}\n"
    f"d0 rel={ (d_centers[0]-tip_xy).round(3) } d1 rel={ (d_centers[1]-tip_xy).round(3) }\n"
    f"spacing={np.linalg.norm(d_centers[1]-d_centers[0]):.3f}"
)


def parallelogram(center_xy, short, long_len, short_ang_rad, acute_rad):
    """Parallelogram with one side = tip cut (short @ short_ang); longer adjacent side."""
    u = np.array([np.cos(short_ang_rad), np.sin(short_ang_rad)]) * short
    ca, sa = np.cos(acute_rad), np.sin(acute_rad)
    best = None
    for sn in (1.0, -1.0):
        vdir = np.array(
            [
                np.cos(short_ang_rad) * ca - sn * np.sin(short_ang_rad) * sa,
                sn * np.cos(short_ang_rad) * sa + np.sin(short_ang_rad) * ca,
            ]
        )
        v = vdir * long_len
        corners = np.array(
            [
                center_xy + 0.5 * (u + v),
                center_xy + 0.5 * (u - v),
                center_xy + 0.5 * (-u - v),
                center_xy + 0.5 * (-u + v),
            ]
        )
        # Prefer the rotation whose tip-facing (leftmost) edge is parallel to the tip cut
        # and whose horizontal span matches the liquid-glass oblong look.
        span = corners[:, 0].max() - corners[:, 0].min()
        left_i = int(np.argmin(((corners + np.roll(corners, -1, axis=0)) / 2)[:, 0]))
        left_edge = corners[(left_i + 1) % 4] - corners[left_i]
        left_ang = np.arctan2(left_edge[1], left_edge[0])
        ang_err = abs(((left_ang - short_ang_rad + np.pi) % (2 * np.pi)) - np.pi)
        ang_err = min(ang_err, abs(((left_ang + np.pi - short_ang_rad + np.pi) % (2 * np.pi)) - np.pi))
        score = span - ang_err * 2  # penalize misaligned left edge
        if best is None or score > best[0]:
            best = (score, corners, ang_err)
    corners = best[1]
    # Nudge so the left edge midpoint sits at the liquid-glass tip→left gap.
    # (Centers already come from LG; this keeps the tip-facing side parallel.)
    c = corners.mean(0)
    return corners[np.argsort(np.arctan2(corners[:, 1] - c[1], corners[:, 0] - c[0]))]


long_side = tip_side * LONG_RATIO
diamonds = [
    parallelogram(d_centers[0], tip_side, long_side, short_ang, acute),
    parallelogram(d_centers[1], tip_side, long_side, short_ang, acute),
]

# Snap diamond0's tip-facing edge to the LG tip→left gap (scaled by PROXIMITY).
c0, corners0 = corners4(labg == diam_lg[0].label)
sides0 = []
for j in range(4):
    p0, p1 = corners0[j], corners0[(j + 1) % 4]
    mid = (p0 + p1) / 2
    sides0.append(mid)
left_mid_lg = min(sides0, key=lambda m: m[0])
target_left_mid = tip_xy + PROXIMITY * lg_rel_world(left_mid_lg[0], left_mid_lg[1])
d0c = diamonds[0]
left_i = int(np.argmin(((d0c + np.roll(d0c, -1, axis=0)) / 2)[:, 0]))
cur_left_mid = (d0c[left_i] + d0c[(left_i + 1) % 4]) / 2
delta = target_left_mid - cur_left_mid
diamonds[0] = diamonds[0] + delta
diamonds[1] = diamonds[1] + delta
print(f"snap delta={delta.round(4)} (tip-facing edge → LG gap × {PROXIMITY})")

# Center on the body only so diamond proximity tweaks don't shift the mark vs the PNG.
body_pts = np.vstack([s["outer"] for s in shapes] + [h for s in shapes for h in s["holes"]])
cx = float((body_pts[:, 0].min() + body_pts[:, 0].max()) / 2)
cy = float((body_pts[:, 1].min() + body_pts[:, 1].max()) / 2)


def recenter(pts):
    return [[round(float(x - cx), 4), round(float(y - cy), 4)] for x, y in pts]


payload = {
    "units": "logo-world, y-up, centered at origin",
    "extrude": {
        # Shallower bevel so crossings read as one flat glass table, not a tube.
        "depth": 0.34,
        "bevelThickness": 0.07,
        "bevelSize": 0.07,
        "bevelSegments": 3,
    },
    "shapes": [
        {"outer": recenter(s["outer"]), "holes": [recenter(h) for h in s["holes"]]}
        for s in shapes
    ],
    "diamonds": [
        {"corners": recenter(d), "depth": 0.18, "bevel": 0.028} for d in diamonds
    ],
    "tipCut": {
        "angle": tip_ang,
        "side": float(tip_side),
        "longRatio": float(LONG_RATIO),
    },
}
os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
json.dump(payload, open(out_path, "w"), indent=2)
print(
    f"wrote {out_path}: {len(payload['shapes'])} shapes, "
    f"{len(payload['diamonds'])} diamonds, tip {np.degrees(tip_ang):.1f}°"
)
