# Logo pipeline

Rebuilds the Fíu glass logo and exports the web assets. Silhouette authority is the HQ flat mark in `design/refs/white.png` (alpha): the f (with inner crescent), two u strokes, and two diamond umlauts. Lighting targets `design/refs/liquid-glass.jpg`.

From that the pipeline builds:
- round glass tubes along traced centrelines (variable width from the distance transform)
- crossings welded with an exact boolean union
- two shallow diamond (rhombus) prisms sized to the flat mark
- a red→black liquid-glass studio (for GLB / stills)

Blender 5.2's glass has no dispersion input, so stills (optional) recombine three IOR passes as R/G/B.

Needs `numpy scipy scikit-image skan pillow`, e.g. `python3 -m venv /tmp/fiu-py && /tmp/fiu-py/bin/pip install numpy scipy scikit-image skan pillow`.

```sh
W=/tmp/fiu-logo
# 1–2. Strokes + diamonds from the HQ white mark
/tmp/fiu-py/bin/python scripts/logo/02b_from_white.py design/refs/white.png $W
# 3. Tubes, gems, liquid-glass studio, camera, spin
blender -b --factory-startup --python scripts/logo/03_build.py -- $W design/fiu-logo-glass.blend
# 4. GLB (+ optional Cycles passes if you still want rendered PNGs)
blender -b design/fiu-logo-glass.blend --python scripts/logo/04_export.py -- $W public/brand
# 5. Brand PNGs = flat white mark (not a Blender still)
/tmp/fiu-py/bin/python scripts/logo/05_white_png.py design/refs/white.png public/brand
```

HQ refs: `design/refs/{white,liquid-glass,sticker*}.png|jpg`.

Outputs:
- `design/fiu-logo-glass.blend` / `public/brand/fiu-logo.glb` — editable 3D + WebGL mesh
- `public/brand/fiu-logo.png` / `fiu-logo-solid.png` — flat white mark with alpha

To tweak the 3D by hand, edit the `.blend` and rerun step 4.
