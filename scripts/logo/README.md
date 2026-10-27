# Logo pipeline

Rebuilds the Fiú glass logo from the Canva design pack and exports the web assets. The silhouette comes straight from the Canva home mockup's alpha channel. From it the pipeline builds:
- round glass tubes, swept along traced centrelines
- crossings that weld cleanly (exact boolean union)
- a round brilliant gem and an emerald-cut baguette, both in the same glass as the strokes

The Canva render's look comes from a procedural high-key studio plus dispersion. Blender 5.2's glass has no dispersion input, so the dispersion is rendered as three refraction passes at slightly different IORs, recombined as R, G and B.

Steps 01, 02 and 05 need `numpy scipy scikit-image skan pillow`, e.g. `python3 -m venv /tmp/fiu-py && /tmp/fiu-py/bin/pip install numpy scipy scikit-image skan pillow`.

```sh
W=/tmp/fiu-logo
# 1. Silhouette from the Canva mockup (https://fiumockups.my.canva.site, "Home Screen Desktop Mockup 2", white variant)
/tmp/fiu-py/bin/python scripts/logo/01_canva_mask.py path/to/canva-home-white.png $W
# 2. Stroke centrelines + radii, and dot positions. Check $W/debug.png
/tmp/fiu-py/bin/python scripts/logo/02_centerlines.py $W
# 3. Tubes, gems, material, studio, camera, spin animation
blender -b --factory-startup --python scripts/logo/03_build.py -- $W design/fiu-logo-glass.blend
# 4. GLB + render passes
blender -b design/fiu-logo-glass.blend --python scripts/logo/04_export.py -- $W public/brand
# 5. PNGs
/tmp/fiu-py/bin/python scripts/logo/05_fallback_png.py $W public/brand
```

Outputs:
- `design/fiu-logo-glass.blend`: the editable logo, with the original spin animation on the `FiuLogo` empty.
- `public/brand/fiu-logo.glb`: the mesh for the live WebGL logo.
- `public/brand/fiu-logo-solid.png`: the Canva look (opaque glass). Use it on light backgrounds and for the OG image.
- `public/brand/fiu-logo.png`: the transparent fallback for use over photography.

To tweak the shape or look by hand, edit `design/fiu-logo-glass.blend` and rerun steps 4–5 only.
