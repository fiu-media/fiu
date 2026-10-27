# Logo pipeline

**Web logo (authoritative for the site):** procedural Three.js mesh from
`public/brand/fiu-logo-paths.json` — rounded extrusion of the white mark (so stroke
overlaps are one flat solid, not crossing tubes) plus tip-aligned parallelogram
diamonds sized/placed from `design/refs/liquid-glass.jpg`.

**Flat PNG:** `design/refs/white.png` (alpha).

```sh
W=/tmp/fiu-logo
python3 -m venv /tmp/fiu-py && /tmp/fiu-py/bin/pip install numpy scipy scikit-image skan pillow matplotlib
# Topology + sheared tip-cut angle from the white mark
/tmp/fiu-py/bin/python scripts/logo/02b_from_white.py design/refs/white.png $W
# Contours + liquid-glass diamond layout → JSON for Three.js (no Blender)
/tmp/fiu-py/bin/python scripts/logo/06_paths_for_three.py $W public/brand/fiu-logo-paths.json
# Brand PNGs = flat white mark
/tmp/fiu-py/bin/python scripts/logo/05_white_png.py design/refs/white.png public/brand
```

Tweaks in `06_paths_for_three.py`: `PROXIMITY` (diamond distance to the f tip),
`LONG_RATIO` (from liquid-glass), extrude bevel/depth. Re-run that script and refresh —
no GLB rebuild.

Optional Blender path (`03_build.py` / `04_export.py`) remains for offline glass stills
only; the homepage no longer loads `fiu-logo.glb`.
