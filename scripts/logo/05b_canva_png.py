"""Optional: lift the logo PNGs straight out of the Canva home mockup.

When the Blender solid still reads differently from Canva, this is the closest match
for the static brand assets. The GLB from steps 03–04 remains the live WebGL source.

Usage (needs numpy scipy scikit-image pillow):
  python scripts/logo/05b_canva_png.py <canva_home_white.png> <public_brand_dir>
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.measure import label, regionprops

src, brand = sys.argv[1], sys.argv[2]
os.makedirs(brand, exist_ok=True)

arr = np.asarray(Image.open(src).convert("RGBA"))
H, W = arr.shape[:2]
alpha = arr[..., 3] > 128
lab = label(alpha)
keep = np.zeros_like(alpha)
for p in regionprops(lab):
    cy, cx = p.centroid
    if 0.15 * W < cx < 0.85 * W and 0.08 * H < cy < 0.85 * H:
        keep |= lab == p.label

ys, xs = np.nonzero(keep)
pad = 16
y0, y1 = max(0, ys.min() - pad), min(H, ys.max() + pad + 1)
x0, x1 = max(0, xs.min() - pad), min(W, xs.max() + pad + 1)
out = arr.copy()
out[~keep, 3] = 0
crop = Image.fromarray(out[y0:y1, x0:x1])
hi = crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
pix = np.asarray(hi).copy()
pix[..., 3] = np.clip(gaussian_filter(pix[..., 3].astype(np.float64), 0.6), 0, 255).astype(np.uint8)
logo = Image.fromarray(pix)

for name in ("fiu-logo-solid.png", "fiu-logo.png"):
    path = os.path.join(brand, name)
    logo.save(path, optimize=True)
    print(f"Wrote {path} ({logo.width}x{logo.height}) from Canva mockup")
