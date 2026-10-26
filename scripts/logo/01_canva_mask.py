"""Step 1 of the logo rebuild: lift the logo silhouette out of a Canva mockup.

Usage (needs numpy, scipy, scikit-image, pillow):
  python scripts/logo/01_canva_mask.py <canva_mockup.png> <work_dir>

The white-background home mockups in the Canva pack are exported with transparency, so
their alpha channel is a clean front-on silhouette of the glass logo. The nav pills sit in
the corners and are dropped. The logo is cropped, upsampled 4x with smoothing for clean
edges, and saved as <work_dir>/mask.png.
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.measure import label, regionprops

src, work = sys.argv[1], sys.argv[2]
os.makedirs(work, exist_ok=True)

alpha = np.asarray(Image.open(src).convert("RGBA"))[..., 3].astype(float) / 255
H, W = alpha.shape
mask = alpha > 0.5

lab = label(mask)
keep = np.zeros_like(mask)
for p in regionprops(lab):
    cy, cx = p.centroid
    # Nav pills hug the left and right edges; the logo sits in the middle.
    if 0.15 * W < cx < 0.85 * W:
        keep |= lab == p.label

ys, xs = np.nonzero(keep)
pad = 12
y0, y1 = ys.min() - pad, ys.max() + pad + 1
x0, x1 = xs.min() - pad, xs.max() + pad + 1
crop = np.where(keep, alpha, 0)[y0:y1, x0:x1]

UP = 4
big = ndimage.zoom(crop, UP, order=3)
big = ndimage.gaussian_filter(big, UP * 0.6) > 0.5

Image.fromarray((big * 255).astype(np.uint8)).save(os.path.join(work, "mask.png"))
print(f"mask {big.shape[1]}x{big.shape[0]} from crop {x1 - x0}x{y1 - y0} at ({x0},{y0})")
