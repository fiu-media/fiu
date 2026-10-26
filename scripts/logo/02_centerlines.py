"""Step 2 of the logo rebuild: trace stroke centrelines from the logo silhouette.

Usage (needs numpy, scipy, scikit-image, skan, pillow):
  python scripts/logo/02_centerlines.py <work_dir>

Reads <work_dir>/mask.png (from 01_canva_mask.py) and writes:
  <work_dir>/strokes.json   {"strokes": [{"points": [[x, y, r], ...]}], "dots": [{"center", "size", "angle", "round"}]}
  <work_dir>/debug.png      silhouette, traced strokes (coloured) and dots, for eyeballing

Units: the logo is scaled to 13.4 units wide, y up.

How it works:
  1. Split the silhouette into connected parts. The two largest are the strokes (f and
     u); the rest are the accent dots.
  2. Skeletonise the strokes and read the local half-width from the distance transform.
  3. Turn the skeleton into a graph, then at every junction pair up the branches that
     continue most straight. Crossing strokes (the f's loop, stem and crossbar) come out
     as long continuous paths instead of stubs.
"""

import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skan import Skeleton
from skimage.measure import label, regionprops
from skimage.morphology import skeletonize

work = sys.argv[1]
mask = np.asarray(Image.open(os.path.join(work, "mask.png"))) > 127
H, W = mask.shape
LOGO_WIDTH = 13.4
PX = W / LOGO_WIDTH  # pixels per world unit
mn = np.array([0.0, 0.0])
PAD = 0


def to_px(p):
    return np.stack([p[..., 0] * PX, H - p[..., 1] * PX], axis=-1)


def to_world(px_xy):
    return np.stack([px_xy[..., 0] / PX, (H - px_xy[..., 1]) / PX], axis=-1)


# --- Split dots from strokes --------------------------------------------------
lab = label(mask)
props = sorted(regionprops(lab), key=lambda p: p.area)
dots, stroke_mask = [], np.zeros_like(mask)
strokes_parts = {p.label for p in props[-2:]}  # the f and the u; everything smaller is a dot
for p in props:
    if p.label not in strokes_parts:
        cy, cx = p.centroid
        c = to_world(np.array([cx, cy]))
        dots.append(
            {
                "center": c.tolist(),
                "size": [p.major_axis_length / PX, p.minor_axis_length / PX],
                # skimage: orientation is the angle from the row axis to the major axis.
                # Convert to a y-up angle of the major axis from +x.
                "angle": float(np.pi / 2 - p.orientation) if p.orientation >= 0 else float(-np.pi / 2 - p.orientation),
                "round": bool(p.major_axis_length / max(p.minor_axis_length, 1) < 1.4),
            }
        )
    else:
        stroke_mask |= lab == p.label
dots.sort(key=lambda d: d["center"][0])

# --- Skeleton + half-widths ---------------------------------------------------
smooth = ndimage.gaussian_filter(stroke_mask.astype(float), 3) > 0.5
dist = ndimage.distance_transform_edt(smooth)
skel = skeletonize(smooth)
sk = Skeleton(skel)

paths = [sk.path_coordinates(i) for i in range(sk.n_paths)]  # (n, 2) row, col
ends = [(sk.path(i)[0], sk.path(i)[-1]) for i in range(sk.n_paths)]
deg = np.bincount(np.concatenate([[a, b] for a, b in ends]), minlength=sk.coordinates.shape[0])

# Drop short spurs that end in nothing (skeleton noise at blunt stroke ends).
min_len = 0.6 * PX
keep = []
for i, (a, b) in enumerate(ends):
    length = np.linalg.norm(np.diff(paths[i], axis=0), axis=1).sum()
    if (deg[a] == 1 or deg[b] == 1) and length < min_len and not (deg[a] == 1 and deg[b] == 1):
        continue
    keep.append(i)
paths = [paths[i] for i in keep]
ends = [ends[i] for i in keep]

# Merge junction nodes that sit very close together (a crossing often skeletonises
# into two 3-way junctions joined by a tiny segment).
node_xy = sk.coordinates
junction_ids = sorted({n for e in ends for n in e})
parent = {n: n for n in junction_ids}


def find(n):
    while parent[n] != n:
        parent[n] = parent[parent[n]]
        n = parent[n]
    return n


tiny = []
for i, (a, b) in enumerate(ends):
    length = np.linalg.norm(np.diff(paths[i], axis=0), axis=1).sum()
    if length < 0.8 * PX and a != b and deg[a] > 1 and deg[b] > 1:
        parent[find(a)] = find(b)
        tiny.append(i)
paths = [p for i, p in enumerate(paths) if i not in tiny]
ends = [(find(a), find(b)) for i, (a, b) in enumerate(ends) if i not in tiny]


def direction_out(path, from_start):
    # Skeletons bend just before a junction, so measure the heading a little way out.
    seg = path if from_start else path[::-1]
    arc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(seg, axis=0), axis=1))])
    a = np.searchsorted(arc, min(0.25 * PX, arc[-1] * 0.3))
    b = np.searchsorted(arc, min(0.9 * PX, arc[-1] * 0.8))
    d = seg[min(b, len(seg) - 1)] - seg[a]
    return d / (np.linalg.norm(d) + 1e-9)


# At each node, pair incident branches by straightest continuation.
incident = {}
for i, (a, b) in enumerate(ends):
    incident.setdefault(a, []).append((i, True))
    incident.setdefault(b, []).append((i, False))

link = {}  # (path, at_start) -> (path, at_start)
for node, inc in incident.items():
    if len(inc) < 2:
        continue
    free = list(inc)
    while len(free) >= 2:
        best, pair = -2, None
        for x in range(len(free)):
            for y in range(x + 1, len(free)):
                (i, si), (j, sj) = free[x], free[y]
                if i == j:
                    continue
                score = -direction_out(paths[i], si) @ direction_out(paths[j], sj)
                if score > best:
                    best, pair = score, (x, y)
        if pair is None or best < 0.2:
            break
        x, y = pair
        link[free[x]] = free[y]
        link[free[y]] = free[x]
        free = [f for k, f in enumerate(free) if k not in pair]

# Junction centres (crossings and T-joins), used to smooth strokes through them.
junction_centres = []
for root, inc in incident.items():
    if len(inc) >= 3:
        members = [n for n in junction_ids if find(n) == root]
        junction_centres.append(node_xy[members].mean(axis=0))
junction_centres = np.array(junction_centres).reshape(-1, 2)

# Walk chains.
used = set()
strokes = []


def walk(start_path, start_at_start):
    chain = []
    i, enter_at_start = start_path, start_at_start
    while True:
        used.add(i)
        p = paths[i] if enter_at_start else paths[i][::-1]
        chain.append(p if not chain else p[1:])
        nxt = link.get((i, not enter_at_start))
        if nxt is None or nxt[0] in used:
            return np.concatenate(chain)
        i, enter_at_start = nxt


def hermite(p0, p1, m0, m1, n):
    t = np.linspace(0, 1, n + 2)[1:-1, None]
    h00, h10 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t
    h01, h11 = -2 * t**3 + 3 * t**2, t**3 - t**2
    return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1


def bridge_junctions(rc, r):
    """Skeletons wobble and widen where strokes meet. Through a crossing, replace that
    stretch with a smooth curve and interpolated radius. A stroke that merely ends at a
    junction (the u's bowl tucking into its stem) is trimmed and run on straight."""
    if not len(junction_centres):
        return rc, r
    d = np.min(np.linalg.norm(rc[:, None, :] - junction_centres[None], axis=2), axis=1)
    near = d < 0.5 * PX
    n = len(rc)
    k = 0
    while k < n:
        if not near[k]:
            k += 1
            continue
        a = k
        while k < n and near[k]:
            k += 1
        b = k - 1
        if a >= 3 and b <= n - 4:
            p0, p1 = rc[a - 1], rc[b + 1]
            chord = np.linalg.norm(p1 - p0)
            t0 = rc[a - 1] - rc[a - 3]
            t1 = rc[b + 3] - rc[b + 1]
            m0 = t0 / (np.linalg.norm(t0) + 1e-9) * chord
            m1 = t1 / (np.linalg.norm(t1) + 1e-9) * chord
            rc[a : b + 1] = hermite(p0, p1, m0, m1, b - a + 1)
            r[a : b + 1] = np.linspace(r[a - 1], r[b + 1], b - a + 3)[1:-1]
        elif a == 0 and b < n - 4:
            run = b + 1
            tdir = rc[b + 1] - rc[b + 4]
            tdir /= np.linalg.norm(tdir) + 1e-9
            step = np.linalg.norm(rc[b + 2] - rc[b + 1])
            rc[: b + 1] = rc[b + 1] + np.outer(np.arange(run, 0, -1) * step * 0.8, tdir)
            r[: b + 1] = r[b + 1]
        elif b == n - 1 and a > 3:
            run = n - a
            tdir = rc[a - 1] - rc[a - 4]
            tdir /= np.linalg.norm(tdir) + 1e-9
            step = np.linalg.norm(rc[a - 1] - rc[a - 2])
            rc[a:] = rc[a - 1] + np.outer(np.arange(1, run + 1) * step * 0.8, tdir)
            r[a:] = r[a - 1]
    return rc, r


for i in range(len(paths)):
    if i in used:
        continue
    # start from an end that has no link, if any
    if (i, True) not in link:
        strokes.append(walk(i, True))
    elif (i, False) not in link:
        strokes.append(walk(i, False))
for i in range(len(paths)):
    if i not in used:  # closed loops
        strokes.append(walk(i, True))

# --- Resample, smooth, attach radii -------------------------------------------
out = []
for s in strokes:
    seg = np.linalg.norm(np.diff(s, axis=0), axis=1)
    L = seg.sum()
    if L < 0.4 * PX:
        continue
    t = np.concatenate([[0], np.cumsum(seg)])
    n = max(int(L / (0.08 * PX)), 8)
    ts = np.linspace(0, L, n)
    rc = np.stack([np.interp(ts, t, s[:, 0]), np.interp(ts, t, s[:, 1])], axis=1)
    r = ndimage.map_coordinates(dist, rc.T, order=1) / PX
    rc, r = bridge_junctions(rc, r)
    # The source silhouette is low-res, so smooth generously: clean tubes beat wobbly fidelity.
    rc = ndimage.gaussian_filter1d(rc, 3, axis=0, mode="nearest")
    r = ndimage.gaussian_filter1d(r, 5, mode="nearest")
    xy = to_world(rc[:, ::-1])
    closed = np.linalg.norm(xy[0] - xy[-1]) < 0.05
    caps = []
    if not closed:
        # The skeleton stops about one radius short of the outline. Blunt ends (the f's
        # bars, the top of the u) are run straight out to the outline and cut flat; thin
        # ends taper to a rounded point.
        r_max = r.max()

        def cap(xy, r, at_start):
            p0, p1 = (xy[0], xy[3]) if at_start else (xy[-1], xy[-4])
            tdir = (p0 - p1) / (np.linalg.norm(p0 - p1) + 1e-9)
            r0 = r[0] if at_start else r[-1]
            steps = np.linspace(0, 1, 7)[1:]
            blunt = r0 > 0.6 * r_max
            if blunt:
                ext = p0 + np.outer(steps * r0 * 0.9, tdir)
                er = np.full_like(steps, r0)
            else:
                ext = p0 + np.outer(steps * r0 * 0.95, tdir)
                er = r0 * np.sqrt(np.clip(1 - steps**2, 0.0004, 1))
            if at_start:
                return np.vstack([ext[::-1], xy]), np.concatenate([er[::-1], r]), blunt
            return np.vstack([xy, ext]), np.concatenate([r, er]), blunt

        xy, r, blunt_start = cap(xy, r, True)
        xy, r, blunt_end = cap(xy, r, False)
        caps = ["flat" if blunt_start else "point", "flat" if blunt_end else "point"]
    out.append(
        {"points": np.column_stack([xy, r]).round(5).tolist(), "closed": bool(closed), "caps": caps}
    )

json.dump({"strokes": out, "dots": dots}, open(os.path.join(work, "strokes.json"), "w"))

# --- Debug image ----------------------------------------------------------------
img = Image.fromarray((mask * 60).astype(np.uint8)).convert("RGB")
draw = ImageDraw.Draw(img)
palette = [(255, 80, 80), (80, 200, 255), (255, 200, 60), (120, 255, 120), (220, 120, 255), (255, 140, 200)]
for k, s in enumerate(out):
    p = np.array(s["points"])
    px = to_px(p[:, :2])
    col = palette[k % len(palette)]
    draw.line([tuple(q) for q in px], fill=col, width=6)
    for q, r in zip(px[::6], p[::6, 2]):
        rr = r * PX
        draw.ellipse([q[0] - rr, q[1] - rr, q[0] + rr, q[1] + rr], outline=col, width=2)
for d in dots:
    c = to_px(np.array(d["center"]))
    a = d["angle"]
    L = d["size"][0] / 2 * PX
    draw.line([c[0] - L * np.cos(a), c[1] + L * np.sin(a), c[0] + L * np.cos(a), c[1] - L * np.sin(a)], fill=(255, 255, 255), width=6)
img.thumbnail((1600, 1600))
img.save(os.path.join(work, "debug.png"))
print(f"{len(out)} strokes, {len(dots)} dots")
for k, s in enumerate(out):
    p = np.array(s["points"])
    print(f"  stroke {k}: {len(p)} pts, r {p[:, 2].min():.3f}-{p[:, 2].max():.3f}, caps {s['caps']}")
for d in dots:
    print("  dot", d)
