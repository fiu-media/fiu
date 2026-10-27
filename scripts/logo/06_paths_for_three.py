"""Export `public/brand/fiu-logo-paths.json` for the procedural Three.js logo.

Authority:
  - Stroke centreline + radius: design/refs/white.png via 02b_from_white.py
  - Tip taper emphasis (`TAPER_POWER`): liquid-glass.jpg look
  - Diamond size ratio + tip-relative placement: design/refs/liquid-glass.jpg
  - Tip-cut angle (sheared): measured from white.png next to the first diamond

Usage:
  python scripts/logo/02b_from_white.py design/refs/white.png /tmp/fiu-logo
  python scripts/logo/06_paths_for_three.py [/tmp/fiu-logo] [public/brand/fiu-logo-paths.json]
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

# Pull d0 slightly closer to the tip than raw LG — but keep full pair spacing.
# (Scaling both centroids by PROXIMITY also crushed d0→d1 and left d1 too far left.)
PROXIMITY = 0.88
lg_rels = [lg_rel_world(c[0], c[1]) for c in lg_centers_px]
# White diamond spacing matches the separated ü bowls better than LG's tighter pair.
white_span = abs(
    px_to_world(diamonds_p[1].centroid[1], diamonds_p[1].centroid[0])[0]
    - px_to_world(diamonds_p[0].centroid[1], diamonds_p[0].centroid[0])[0]
)
lg_span = float(np.linalg.norm(lg_rels[1] - lg_rels[0]))
pair_span = lg_rels[1] - lg_rels[0]
if lg_span > 1e-6:
    pair_span = pair_span * (white_span / lg_span)
d_centers = [
    tip_xy + PROXIMITY * lg_rels[0],
    tip_xy + PROXIMITY * lg_rels[0] + pair_span,
]
short_ang = tip_ang  # white tip cut is the alignment authority
# Lock long edges to the f crossbar tangent at the tip so the gems read as a
# sliced pair with the cap: short // tip cut, long // stroke.
_tip_pt = np.array(tip_pt[:2], float)
_prev = np.array(
    max(strokes["strokes"], key=lambda s: len(s["points"]))["points"][-4][:2], float
)
_tangent = math.atan2(_tip_pt[1] - _prev[1], _tip_pt[0] - _prev[0])
# Keep acute in (0, π); sn below picks the oblong shear that matches white/LG.
acute = abs(((_tangent - short_ang + math.pi) % (2 * math.pi)) - math.pi)

print(
    f"tip world={tip_xy.round(3)} ang={np.degrees(tip_ang):.1f}° side={tip_side:.3f}\n"
    f"diamond short={np.degrees(short_ang):.1f}° long={np.degrees(_tangent):.1f}° "
    f"acute={np.degrees(acute):.1f}°\n"
    f"LG scale={scale:.5f} long/short={LONG_RATIO:.3f}\n"
    f"d0 rel={ (d_centers[0]-tip_xy).round(3) } d1 rel={ (d_centers[1]-tip_xy).round(3) }\n"
    f"spacing={np.linalg.norm(d_centers[1]-d_centers[0]):.3f}"
)


def parallelogram(center_xy, short, long_len, short_ang_rad, acute_rad):
    """Parallelogram: short side // tip cut; long side // crossbar tangent (refs)."""
    u = np.array([np.cos(short_ang_rad), np.sin(short_ang_rad)]) * short
    ca, sa = np.cos(acute_rad), np.sin(acute_rad)
    # sn=+1 yields long ≈ crossbar tangent (oblong like white / liquid-glass).
    sn = 1.0
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


# --- Variable-radius strokes (authority for the live tube mesh) ----------------
# white.png already tapers, but liquid-glass tips are sharper. Emphasize the
# belly→tip falloff while keeping flat-cap ends near their measured radius.
TAPER_POWER = 1.35


def sharpen_stroke(points):
    rs = np.array([p[2] for p in points], dtype=float)
    rmax = float(rs.max()) or 1.0
    out = []
    for x, y, r in points:
        t = max(float(r) / rmax, 0.0)
        r2 = rmax * (t**TAPER_POWER)
        out.append([round(float(x - cx), 4), round(float(y - cy), 4), round(float(r2), 4)])
    return out


stroke_payload = []
for s in strokes["strokes"]:
    # Keep white/liquid-glass flat tips (ü left top matches the f crossbar cuts).
    stroke_payload.append(
        {
            "points": sharpen_stroke(s["points"]),
            "closed": bool(s.get("closed", False)),
            "caps": list(s.get("caps", ["flat", "flat"])),
        }
    )

# --- Align ü (white-derived) to liquid-glass layout ----------------------------
# Diamonds are already placed from liquid-glass tip-relative coords. The ü bowls
# from white.png sit a little further right / differently angled — nudge them so
# both mesh modes and the diamonds agree with the glass reference.
def _rigid(pts, origin, dx, dy, dang):
    ca, sa = np.cos(dang), np.sin(dang)
    ox, oy = origin
    out = []
    for p in pts:
        x, y = float(p[0]) - ox, float(p[1]) - oy
        xr, yr = ca * x - sa * y, sa * x + ca * y
        np_ = [round(xr + ox + dx, 4), round(yr + oy + dy, 4)]
        if len(p) > 2:
            np_.append(p[2])
        out.append(np_)
    return out


# F width in centered stroke space (stroke 0).
_f_pts = np.array([p[:2] for p in stroke_payload[0]["points"]], float)
_fw = float(_f_pts[:, 0].max() - _f_pts[:, 0].min())
_fh = float(_f_pts[:, 1].max() - _f_pts[:, 1].min())
# Measured white→LG deltas (fraction of F size) for ü left / ü right.
_U_ALIGN = [
    # (stroke_index, dx/fw, dy/fh, dangle_deg)
    (1, -0.018, -0.005, -2.3),
    (2, -0.035, -0.005, -0.2),
]
_u_stroke_xf = {}
for si, fdx, fdy, dang_deg in _U_ALIGN:
    pts = np.array([p[:2] for p in stroke_payload[si]["points"]], float)
    origin = pts.mean(0)
    dx, dy, dang = fdx * _fw, fdy * _fh, np.radians(dang_deg)
    stroke_payload[si]["points"] = _rigid(stroke_payload[si]["points"], origin, dx, dy, dang)
    _u_stroke_xf[si] = (origin, dx, dy, dang)
    print(
        f"ü align stroke{si}: dx={dx:+.3f} dy={dy:+.3f} "
        f"rot={dang_deg:+.1f}° (LG vs white)"
    )

shapes_payload = [
    {"outer": recenter(s["outer"]), "holes": [recenter(h) for h in s["holes"]]}
    for s in shapes
]
# Match extrude shapes to the same ü alignment (by nearest stroke centroid).
for sh in shapes_payload:
    outer = np.array(sh["outer"], float)
    sc = outer.mean(0)
    # Skip F (has holes) and the inner crescent (left of F).
    if sh["holes"] or sc[0] < 0:
        continue
    best_si, best_d = None, 1e9
    for si in _u_stroke_xf:
        stc = np.array([p[:2] for p in stroke_payload[si]["points"]], float).mean(0)
        d = float(np.linalg.norm(sc - stc))
        if d < best_d:
            best_d, best_si = d, si
    if best_si is None:
        continue
    origin, dx, dy, dang = _u_stroke_xf[best_si]
    sh["outer"] = _rigid(sh["outer"], origin, dx, dy, dang)
    sh["holes"] = [_rigid(h, origin, dx, dy, dang) for h in sh["holes"]]

def _scale_about(pts, cxy, scale, nudge=(0.0, 0.0)):
    nx, ny = nudge
    return [
        [
            round(float((x - cxy[0]) * scale + cxy[0] + nx), 4),
            round(float((y - cxy[1]) * scale + cxy[1] + ny), 4),
        ]
        for x, y in pts
    ]


# Shrink the f inner crescent so extrude bevels don't close the gap to the outer wall.
CRESCENT_SCALE = 0.78
for sh in shapes_payload:
    if sh["holes"]:
        continue
    outer = np.array(sh["outer"], float)
    if outer[:, 0].mean() >= -0.5:
        continue
    sh["outer"] = _scale_about(outer, outer.mean(0), CRESCENT_SCALE, nudge=(0.05, 0.04))
    print(f"crescent inset ×{CRESCENT_SCALE} (+nudge) for extrude gap")

# Separate the two ü bowls — raw gap (~0.04) is smaller than 2× bevel, so they fuse.
# Scale each down, then push apart until the gap clears the fillet.
U_SCALE = 0.9
U_GAP_TARGET = 0.22  # > 2 × extrude bevelSize so filleted edges stay separate
u_shapes = [
    sh
    for sh in shapes_payload
    if not sh["holes"] and np.array(sh["outer"], float)[:, 0].mean() > 0
]
u_shapes.sort(key=lambda sh: np.array(sh["outer"], float)[:, 0].mean())
if len(u_shapes) >= 2:
    for sh in u_shapes:
        outer = np.array(sh["outer"], float)
        sh["outer"] = _scale_about(outer, outer.mean(0), U_SCALE)

    def _min_gap(a, b):
        # Subsample for speed; contours are dense.
        aa, bb = a[::2], b[::2]
        d = ((aa[:, None, :] - bb[None, :, :]) ** 2).sum(-1)
        return float(np.sqrt(d.min()))

    left = np.array(u_shapes[0]["outer"], float)
    right = np.array(u_shapes[1]["outer"], float)
    gap0 = _min_gap(left, right)
    # Closest-point direction ≈ separation axis.
    aa, bb = left[::2], right[::2]
    d2 = ((aa[:, None, :] - bb[None, :, :]) ** 2).sum(-1)
    i, j = np.unravel_index(int(np.argmin(d2)), d2.shape)
    sep = bb[j] - aa[i]
    sep_n = sep / (np.linalg.norm(sep) + 1e-9)
    need = max(0.0, U_GAP_TARGET - gap0)
    # Split the push evenly.
    push = 0.5 * need * sep_n
    u_shapes[0]["outer"] = [
        [round(float(x - push[0]), 4), round(float(y - push[1]), 4)] for x, y in u_shapes[0]["outer"]
    ]
    u_shapes[1]["outer"] = [
        [round(float(x + push[0]), 4), round(float(y + push[1]), 4)] for x, y in u_shapes[1]["outer"]
    ]
    gap1 = _min_gap(np.array(u_shapes[0]["outer"], float), np.array(u_shapes[1]["outer"], float))
    print(f"ü separate: scale×{U_SCALE} gap {gap0:.3f}→{gap1:.3f} (target {U_GAP_TARGET})")

# --- Diamonds: tip-relative LG placement (already snapped), body-recentered --------
# Size = f tip diameter × LG long/short. Height/spacing from liquid-glass tip mid
# (PROXIMITY pull), not ü-tip offsets — those sat too low and stretched the pair.
diamonds_out = [np.array(recenter(d), float) for d in diamonds]
for i, d in enumerate(diamonds_out):
    print(f"diamond{i} center={d.mean(0).round(3)} "
          f"(tip-rel LG × {PROXIMITY}, short={tip_side:.3f})")
# Gem chamfer: large bevel relative to depth → clear faceted table like liquid-glass.
DIAMOND_DEPTH = 0.15
DIAMOND_BEVEL = 0.065

payload = {
    "units": "logo-world, y-up, centered at origin",
    # Round tubes: local depth ≈ 2r along each centreline (liquid-glass).
    "strokes": stroke_payload,
    # Flat silhouette extrude — deep rounded fillet (liquid-glass pillow edge).
    "extrude": {
        "depth": 0.30,
        "bevelThickness": 0.09,
        "bevelSize": 0.09,
        "bevelSegments": 6,
    },
    "shapes": shapes_payload,
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
        "longRatio": float(LONG_RATIO),
        "taperPower": TAPER_POWER,
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
