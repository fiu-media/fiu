"""Export brand PNGs from the HQ flat white mark (design/refs/white.png).

Preferred fallback: the flat mark, not a Blender still. Keeps gem silhouettes and the
inner f-curve exact.

Usage:
  python scripts/logo/05_white_png.py [design/refs/white.png] [public/brand]
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

src = sys.argv[1] if len(sys.argv) > 1 else "design/refs/white.png"
brand = sys.argv[2] if len(sys.argv) > 2 else "public/brand"
os.makedirs(brand, exist_ok=True)

arr = np.asarray(Image.open(src).convert("RGBA"))
# Authoritative alpha; rebuild RGB as pure white so the mark is clean on any backdrop.
a = arr[..., 3].astype(np.float64)
# Mild edge soften for retina downscales
a = np.clip(gaussian_filter(a, 0.4), 0, 255)
ys, xs = np.nonzero(a > 8)
pad = 16
y0, y1 = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + pad + 1)
x0, x1 = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + pad + 1)
crop_a = a[y0:y1, x0:x1]
out = np.zeros((crop_a.shape[0], crop_a.shape[1], 4), np.uint8)
out[..., :3] = 255
out[..., 3] = crop_a.round().astype(np.uint8)
logo = Image.fromarray(out)

# 2× for crisp brand use
logo = logo.resize((logo.width * 2, logo.height * 2), Image.LANCZOS)
for name in ("fiu-logo.png", "fiu-logo-solid.png"):
    path = os.path.join(brand, name)
    logo.save(path, optimize=True)
    print(f"Wrote {path} ({logo.width}x{logo.height}) from white mark")
