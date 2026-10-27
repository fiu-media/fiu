# Logo pipeline

**Web logo (authoritative for the site):** procedural Three.js mesh from
`public/brand/fiu-logo-paths.json`. Tube mode is pure variable-radius centreline
tubes; extrude mode is the flat silhouette (crescent inset so it doesn't touch the
f bowl). Diamonds are the two white.png parallelograms with a gem chamfer. Home hero
Tubes / Extrude toggle for A/B.

**Flat PNG:** `design/refs/white.png` (alpha).

```sh
W=/tmp/fiu-logo
python3 -m venv /tmp/fiu-py && /tmp/fiu-py/bin/pip install numpy scipy scikit-image skan pillow matplotlib
# Topology + sheared tip-cut angle from the white mark
/tmp/fiu-py/bin/python scripts/logo/02b_from_white.py design/refs/white.png $W
# Centreline radii + liquid-glass diamond layout → JSON for Three.js (no Blender)
/tmp/fiu-py/bin/python scripts/logo/06_paths_for_three.py $W public/brand/fiu-logo-paths.json
# Brand PNGs = flat white mark
/tmp/fiu-py/bin/python scripts/logo/05_white_png.py design/refs/white.png public/brand
```

Everything in `06_paths_for_three.py` is traced from `design/refs/white.png` (ü segments and
dots sit exactly where the white mark has them; liquid-glass.jpg is no longer used).

- Extrude shapes are emitted pre-inset by a per-shape `bevel`: three pushes the side walls
  outward by `bevelSize`, and clamps that push to √2·bevel at corners sharper than 90°, which
  blunts needle tips. Sharp tips are walked out to the real white.png apex and compensated, so
  the extruded outline reproduces the artwork (tips included). `BEVEL_MAX` caps the bevel; it is
  reduced per shape so thin slivers (the f bowl, the crescent) never break.
- Tube centrelines are extended from the skeleton end to the white.png silhouette (flat and point ends).

Re-run that script and refresh — no GLB rebuild.

Optional Blender path (`03_build.py` / `04_export.py`) remains for offline glass stills
only; the homepage no longer loads `fiu-logo.glb`.
