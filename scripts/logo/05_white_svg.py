"""Export the flat white mark as an SVG by tracing the alpha of design/refs/white.png.

Same crop + padding as 05_white_png.py, so the SVG frames the mark exactly like the PNG did.
The alpha is upscaled and lightly smoothed before tracing, so potrace fits Béziers to the
artwork's curves rather than its pixel staircase.

Usage:
  pip install numpy scipy pillow potracer
  python scripts/logo/05_white_svg.py [design/refs/white.png] [public/brand/fiu-logo.svg]
"""

import os
import sys

import numpy as np
import potrace
from PIL import Image
from scipy.ndimage import gaussian_filter

src = sys.argv[1] if len(sys.argv) > 1 else "design/refs/white.png"
out_path = sys.argv[2] if len(sys.argv) > 2 else "public/brand/fiu-logo.svg"
os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)

SCALE = 4  # trace at 4× so curve fitting sees sub-pixel edges
PAD = 16

alpha_img = Image.open(src).convert("RGBA").getchannel("A")
a = np.asarray(alpha_img)
ys, xs = np.nonzero(a > 8)
y0, y1 = max(0, ys.min() - PAD), min(a.shape[0], ys.max() + PAD + 1)
x0, x1 = max(0, xs.min() - PAD), min(a.shape[1], xs.max() + PAD + 1)
crop = alpha_img.crop((x0, y0, x1, y1))
w, h = crop.size

big = crop.resize((w * SCALE, h * SCALE), Image.LANCZOS)
smooth = gaussian_filter(np.asarray(big).astype(np.float64), SCALE * 0.9)
mask = smooth >= 128

# potracer traces the dark (False) pixels, so pass the inverse. Keep thin needle tips
# (small turdsize) but let the curve optimiser smooth the staircase.
curves = potrace.Bitmap(~mask).trace(
    turdsize=8,
    turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
    alphamax=1.2,
    opticurve=True,
    opttolerance=1.0,
)


def pt(p):
    return f"{p.x / SCALE:.2f} {p.y / SCALE:.2f}"


parts = []
for curve in curves:
    parts.append(f"M{pt(curve.start_point)}")
    for seg in curve.segments:
        if seg.is_corner:
            parts.append(f"L{pt(seg.c)}L{pt(seg.end_point)}")
        else:
            parts.append(f"C{pt(seg.c1)} {pt(seg.c2)} {pt(seg.end_point)}")
    parts.append("Z")

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none">'
    f'<path fill="#fff" fill-rule="evenodd" d="{"".join(parts)}"/></svg>\n'
)
with open(out_path, "w") as f:
    f.write(svg)
print(f"Wrote {out_path} ({w}x{h} viewBox, {len(svg) / 1024:.1f} KB, {len(curves)} contours)")
