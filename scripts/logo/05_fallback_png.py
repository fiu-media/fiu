"""Step 5 of the logo rebuild: build the PNG logos from the render passes.

Usage (needs numpy, pillow):
  python scripts/logo/05_fallback_png.py <work_dir> <public_brand_dir>

Writes (both trimmed to the logo):
  fiu-logo-solid.png  the Canva look: opaque glass refracting a bright studio, with
                      dispersion from the three IOR passes recombined as R, G and B.
                      Best on light backgrounds and for the OG image.
  fiu-logo.png        transparent fallback for photography: the see-through highlights
                      pass over a faint copy of the solid render, so the logo reads as
                      clear glass on any background.
"""

import os
import sys

import numpy as np
from PIL import Image

work, brand = sys.argv[1], sys.argv[2]
REFRACTION_OPACITY = 0.45


def load(name):
    img = Image.open(os.path.join(work, name)).convert("RGBA")
    return np.asarray(img).astype(np.float64) / 255


r, g, b = (load(f"pass-refraction-{c}.png") for c in "rgb")
solid = np.stack([r[..., 0], g[..., 1], b[..., 2], np.maximum.reduce([r[..., 3], g[..., 3], b[..., 3]])], -1)

hi = load("pass-highlights.png")
hi_a, rf_a = hi[..., 3:], solid[..., 3:] * REFRACTION_OPACITY
alpha = hi_a + rf_a * (1 - hi_a)
premult = hi[..., :3] * hi_a + solid[..., :3] * rf_a * (1 - hi_a)
rgb = np.divide(premult, alpha, out=np.zeros_like(premult), where=alpha > 1e-6)
clear = np.concatenate([rgb, alpha], axis=-1)

# Crop both to the same bounds so they can be swapped without layout shift.
ys, xs = np.nonzero(solid[..., 3] > 0.004)
pad = 12
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, solid.shape[0])
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, solid.shape[1])

for name, img in [("fiu-logo-solid.png", solid), ("fiu-logo.png", clear)]:
    out = np.clip(img[y0:y1, x0:x1], 0, 1)
    path = os.path.join(brand, name)
    Image.fromarray((out * 255).round().astype(np.uint8)).save(path, optimize=True)
    print(f"Wrote {path} ({out.shape[1]}x{out.shape[0]})")
