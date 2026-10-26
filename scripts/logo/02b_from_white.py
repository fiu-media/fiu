"""Trace strokes + diamond dots from design/refs/white.png (alpha channel).

Builds mask.png then runs the same centreline/junction logic as 02_centerlines.py, but
treats every non-diamond component as a stroke (f, two u pieces, inner crescent) instead
of assuming only two stroke blobs.

Usage:
  python scripts/logo/02b_from_white.py [design/refs/white.png] [work_dir]
"""

import os
import runpy
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.measure import label, regionprops

src = sys.argv[1] if len(sys.argv) > 1 else "design/refs/white.png"
work = sys.argv[2] if len(sys.argv) > 2 else "/tmp/fiu-logo"
os.makedirs(work, exist_ok=True)

arr = np.asarray(Image.open(src).convert("RGBA"))
mask0 = arr[..., 3] > 128
UP = 4
big = ndimage.zoom(mask0.astype(float), UP, order=0) > 0.5
big = ndimage.gaussian_filter(big.astype(float), UP * 0.15) > 0.5
Image.fromarray((big * 255).astype(np.uint8)).save(os.path.join(work, "mask.png"))

# Patch 02_centerlines: all non-diamond ink is stroke material.
here = os.path.dirname(os.path.abspath(__file__))
code = open(os.path.join(here, "02_centerlines.py")).read()
old = "strokes_parts = {p.label for p in props[-2:]}  # the f and the u; everything smaller is a dot"
new = """_sorted = sorted(props, key=lambda p: -p.area)
_diamonds = sorted(
    [p for p in _sorted if p.area < _sorted[0].area * 0.08 and p.centroid[0] < H * 0.4],
    key=lambda p: -p.area,
)[:2]
_dlabels = {p.label for p in _diamonds}
strokes_parts = {p.label for p in props if p.label not in _dlabels}"""
if old not in code:
    raise SystemExit("02_centerlines.py changed; update 02b_from_white.py patch")
path = os.path.join(work, "_02_patched.py")
open(path, "w").write(code.replace(old, new))
sys.argv = [path, work]
runpy.run_path(path, run_name="__main__")

# Confirm + measure the f crossbar tip cut (often sheared, not ⊥ to the centreline).
import json

data = json.load(open(os.path.join(work, "strokes.json")))
print(f"white mark → {len(data['strokes'])} strokes, {len(data['dots'])} diamonds")

# The flat tip beside the first diamond: right silhouette of the f near that diamond.
# Diamonds are oriented so one side matches this cut — same angle and length.
lab0 = label(mask0)
props0 = sorted(regionprops(lab0), key=lambda p: -p.area)
f0 = props0[0]
diamonds0 = sorted(
    [p for p in props0 if p.area < f0.area * 0.08 and p.centroid[0] < mask0.shape[0] * 0.45],
    key=lambda p: p.centroid[1],
)[:2]
if diamonds0:
    d0 = diamonds0[0]
    cy, cx = d0.centroid
    fmask = lab0 == f0.label
    y0, y1 = max(0, int(cy) - 70), min(mask0.shape[0], int(cy) + 40)
    edge = []
    for y in range(y0, y1):
        xs = np.where(fmask[y])[0]
        if len(xs) and xs.max() < cx - 2:
            edge.append((float(xs.max()), float(y)))
    edge = np.asarray(edge)
    if len(edge) >= 8:
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
        a, b = seg[int(np.argmin(proj))], seg[int(np.argmax(proj))]
        # Image y-down → logo y-up angle.
        ang = float(np.arctan2(-(b[1] - a[1]), b[0] - a[0]))
        length_px = float(np.linalg.norm(b - a))
        # white.png px → world (same units as strokes.json: logo width 13.4).
        # mask is 4× white; 02_centerlines uses PX = mask_W / 13.4.
        Hw, Ww = mask0.shape
        length_world = length_px * 13.4 / Ww
        # Prefer the stroke tip diameter when the silhouette walk is short/noisy.
        dots = sorted(data["dots"], key=lambda d: d["center"][0])
        dot_cx = sum(d["center"][0] for d in dots) / max(len(dots), 1)
        stroke = max(data["strokes"], key=lambda s: len(s["points"]))
        pts = stroke["points"]
        tip = pts[-1] if abs(pts[-1][0] - dot_cx) < abs(pts[0][0] - dot_cx) else pts[0]
        tip_diam = 2.0 * max(tip[2], 0.02)
        side = max(length_world, tip_diam * 0.85)
        if tip_diam > 0:
            side = tip_diam  # authority for length: tube tip diameter
        data["tip_cut"] = {
            "angle": ang,  # radians, logo y-up, direction of the flat cut
            "length": side,
            "length_px": length_px,
        }
        json.dump(data, open(os.path.join(work, "strokes.json"), "w"))
        print(
            f"tip cut angle {np.degrees(ang):.1f}° (sheared vs centreline), "
            f"side={side:.3f} (silhouette {length_world:.3f}px→world, tip diam {tip_diam:.3f})"
        )
