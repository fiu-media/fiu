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

# Confirm
import json

data = json.load(open(os.path.join(work, "strokes.json")))
print(f"white mark → {len(data['strokes'])} strokes, {len(data['dots'])} diamonds")
