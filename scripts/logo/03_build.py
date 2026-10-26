"""Step 3 of the logo rebuild: sweep round glass tubes along the traced strokes and add
cut gems for the accent dots, matching the Canva render.

Usage:
  blender -b --factory-startup --python scripts/logo/03_build.py -- <work_dir> <out.blend>

Reads <work_dir>/strokes.json (from 02_centerlines.py) and saves a self-contained .blend
with:
  - FiuLogo   empty with the original spin-and-settle animation (192 frames)
    - Strokes      NURBS tube sweeps, self-unioned so crossings weld along clean seams
    - GemRound     round brilliant cut (round dot)
    - GemBaguette  emerald/baguette step cut (long dot)
  - one shared clear-glass material, a procedural high-key studio world, and a camera

Axes: the logo lies in Blender's XZ plane, facing -Y (Blender's front view). glTF export
turns that into x right, y up, facing +z.
"""

import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

IOR = 1.6

args = sys.argv[sys.argv.index("--") + 1 :]
work, out_blend = args[0], os.path.abspath(args[1])
data = json.load(open(os.path.join(work, "strokes.json")))

scene = bpy.context.scene
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj)

# Centre the design on the origin.
all_pts = [p for s in data["strokes"] for p in s["points"]]
cx = (min(p[0] for p in all_pts) + max(p[0] for p in all_pts)) / 2
cy = (min(p[1] for p in all_pts) + max(p[1] for p in all_pts)) / 2


def to3d(x, y, depth=0.0):
    return Vector((x - cx, depth, y - cy))


# --- Materials ----------------------------------------------------------------
def glass(name, ior):
    """Plain clear glass. Blender 5.2's glass shaders have no dispersion input, so
    04_export.py renders the refraction three times at slightly different IORs and
    05_fallback_png.py recombines them as red, green and blue."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.remove(nodes["Principled BSDF"])
    g = nodes.new("ShaderNodeBsdfGlass")
    g.name = "Glass BSDF"
    g.inputs["Roughness"].default_value = 0.0
    g.inputs["IOR"].default_value = ior
    links.new(g.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


# The gems use the same glass as the strokes. It's a separate datablock only so 04_export.py
# can give them less dispersion: across many small facets the per-channel IOR split
# otherwise turns them into rainbows, where the Canva gems read as clear glass.
glass_mat = glass("Glass", IOR)
gem_mat = glass("GemGlass", IOR)

# --- Strokes ------------------------------------------------------------------
# Each stroke becomes a smooth NURBS sweep with a round profile. Blunt ends get flat caps;
# pointed ends already taper to ~0 radius in strokes.json.
tubes = []
for k, stroke in enumerate(data["strokes"]):
    curve_data = bpy.data.curves.new(f"Stroke{k}", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_mode = "ROUND"
    curve_data.bevel_depth = 1.0
    curve_data.bevel_resolution = 12
    curve_data.resolution_u = 3
    curve_data.twist_mode = "MINIMUM"
    curve_data.use_fill_caps = True
    pts = stroke["points"]
    spline = curve_data.splines.new("NURBS")
    spline.points.add(len(pts) - 1)
    for sp, (x, y, r) in zip(spline.points, pts):
        sp.co = (*to3d(x, y), 1.0)
        sp.radius = max(r, 0.01)
    spline.order_u = 4
    spline.use_endpoint_u = True
    spline.use_cyclic_u = stroke.get("closed", False)
    obj = bpy.data.objects.new(f"Stroke{k}", curve_data)
    scene.collection.objects.link(obj)
    tubes.append(obj)

bpy.ops.object.select_all(action="DESELECT")
for obj in tubes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = tubes[0]
bpy.ops.object.convert(target="MESH")
bpy.ops.object.join()
strokes = bpy.context.view_layer.objects.active
strokes.name = "Strokes"

# Union the tube with itself: where strokes cross, the overlapping glass is cut away and
# welded along a crisp seam, instead of interpenetrating or blobbing together.
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=1e-5)
bpy.ops.mesh.intersect_boolean(operation="UNION", use_self=True, solver="EXACT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode="OBJECT")
# A fine chamfer on the hard edges (flat bar ends, crossing seams) gives the cut-glass
# glints seen in the Canva render.
bevel = strokes.modifiers.new("Chamfer", "BEVEL")
bevel.limit_method = "ANGLE"
bevel.angle_limit = math.radians(50)
bevel.width = 0.035
bevel.segments = 2
bevel.harden_normals = True
bpy.ops.object.modifier_apply(modifier=bevel.name)
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
strokes.data.materials.append(glass_mat)


# --- Gems ---------------------------------------------------------------------
def ring(bm, verts2d, depth):
    return [bm.verts.new((x, depth, z)) for x, z in verts2d]


def bridge(bm, a, b):
    n = len(a)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))


def bridge_uneven(bm, small, big):
    """Bridge an n-gon ring to a 2n-gon ring (star/kite facets)."""
    n = len(small)
    for i in range(n):
        bm.faces.new((small[i], big[(2 * i + 1) % (2 * n)], small[(i + 1) % n]))
        bm.faces.new((small[i], big[2 * i], big[(2 * i + 1) % (2 * n)]))
    # big[2*i] connects back to small[i-1] side
    for i in range(n):
        bm.faces.new((small[i], big[(2 * i - 1) % (2 * n)], big[2 * i]))


def circle(n, r, phase=0.0):
    return [(r * math.cos(phase + 2 * math.pi * i / n), r * math.sin(phase + 2 * math.pi * i / n)) for i in range(n)]


def round_brilliant(name, radius):
    """Simplified round brilliant: octagonal table, star/kite crown, 16-sided girdle,
    pavilion down to a culet. The table faces the viewer (-Y).

    The cut is deliberately shallow. Real gem proportions use steep pavilions that trap
    light by total internal reflection, which makes them look bright and opaque next to
    the tubes. Shallow facets let light through, so the gems read as the same clear glass."""
    bm = bmesh.new()
    s = radius
    table = ring(bm, circle(8, 0.6 * s, math.pi / 8), -0.24 * s)
    crown = ring(bm, circle(16, 0.86 * s), -0.15 * s)
    girdle_top = ring(bm, circle(16, s, math.pi / 16), -0.04 * s)
    girdle_bot = ring(bm, circle(16, s, math.pi / 16), 0.04 * s)
    pav = ring(bm, circle(16, 0.55 * s, math.pi / 16), 0.24 * s)
    culet = bm.verts.new((0, 0.36 * s, 0))
    bm.faces.new(table[::-1])
    bridge_uneven(bm, table, crown)
    bridge(bm, crown, girdle_top)
    bridge(bm, girdle_top, girdle_bot)
    bridge(bm, girdle_bot, pav)
    for i in range(16):
        bm.faces.new((pav[i], pav[(i + 1) % 16], culet))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def chamfered_rect(length, width, chamfer):
    hl, hw, c = length / 2, width / 2, chamfer
    return [(-hl + c, -hw), (hl - c, -hw), (hl, -hw + c), (hl, hw - c), (hl - c, hw), (-hl + c, hw), (-hl, hw - c), (-hl, -hw + c)]


def emerald_cut(name, length, width):
    """Step-cut baguette with clipped corners: stepped crown, flat table, stepped pavilion
    down to a keel. The table faces the viewer (-Y)."""
    bm = bmesh.new()
    c = 0.18 * width
    # Shallow steps for the same reason as round_brilliant: no light-trapping pavilion.
    rings = [
        (0.7, 0.56, -0.16),  # table
        (0.86, 0.78, -0.1),
        (1.0, 1.0, -0.03),  # girdle
        (1.0, 1.0, 0.03),
        (0.86, 0.74, 0.11),
        (0.68, 0.46, 0.18),
        (0.52, 0.16, 0.22),  # keel
    ]
    built = []
    for sl, sw, d in rings:
        built.append(ring(bm, chamfered_rect(length * sl, width * sw, c * min(sl, sw) + 1e-3), d * width))
    bm.faces.new(built[0][::-1])
    for a, b in zip(built, built[1:]):
        bridge(bm, a, b)
    bm.faces.new(built[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


round_dot = next(d for d in data["dots"] if d["round"])
bag_dot = next(d for d in data["dots"] if not d["round"])

gem_round = bpy.data.objects.new("GemRound", round_brilliant("GemRound", sum(round_dot["size"]) / 4))
gem_round.location = to3d(*round_dot["center"])
gem_bag = bpy.data.objects.new("GemBaguette", emerald_cut("GemBaguette", *bag_dot["size"]))
gem_bag.location = to3d(*bag_dot["center"])
# Rotation about the view axis; Blender's -Y-facing front view flips the sign.
gem_bag.rotation_euler = (0, -bag_dot["angle"], 0)
for g in (gem_round, gem_bag):
    g.data.materials.append(gem_mat)
    scene.collection.objects.link(g)

# --- Rig + animation (same timing as the original file) -------------------------
rig = bpy.data.objects.new("FiuLogo", None)
scene.collection.objects.link(rig)
for o in (strokes, gem_round, gem_bag):
    o.parent = rig
spin = [(1, 0.0), (72, -2 * math.pi), (84, -2 * math.pi - 0.1), (96, -2 * math.pi), (168, 0.0), (180, 0.1), (192, 0.0)]
for frame, z in spin:
    rig.rotation_euler = (0, 0, z)
    rig.keyframe_insert("rotation_euler", index=2, frame=frame)
scene.frame_start, scene.frame_end = 1, 192
scene.frame_set(1)

# --- Camera, world -----------------------------------------------------------------
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
cam.location = (0, -62, 0)
cam.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
# Procedural high-key studio: mostly white, with thin navy, blue and orange bands laid out
# by low-frequency noise over the sky sphere. Refracted through the tubes, they become
# the white body, dark rims and warm/cool streaks of the Canva render.
wn, wl = world.node_tree.nodes, world.node_tree.links


def srgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple((int(h[i : i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)) + (1,)


coord = wn.new("ShaderNodeTexCoord")
noise = wn.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 2.4
noise.inputs["Detail"].default_value = 1.5
noise.inputs["Distortion"].default_value = 0.4
wl.new(coord.outputs["Generated"], noise.inputs["Vector"])
bands = wn.new("ShaderNodeValToRGB")
wl.new(noise.outputs["Fac"], bands.inputs[0])
stops = [
    (0.0, "#ffffff"), (0.35, "#ffffff"), (0.39, "#6c9fff"), (0.42, "#ffffff"), (0.45, "#0c1426"),
    (0.49, "#ffffff"), (0.54, "#ff8526"), (0.565, "#ffffff"), (0.62, "#b4ceff"), (0.66, "#ffffff"),
    (1.0, "#ffffff"),
]
els = bands.color_ramp.elements
els[0].position, els[0].color = stops[0][0], srgb(stops[0][1])
els[1].position, els[1].color = stops[-1][0], srgb(stops[-1][1])
for pos, colour in stops[1:-1]:
    els.new(pos).color = srgb(colour)
wl.new(bands.outputs[0], wn["Background"].inputs["Color"])
wn["Background"].inputs["Strength"].default_value = 1.0

scene.view_settings.view_transform = "Standard"  # AgX greys out glass on a bright set
scene.cycles.transmission_bounces = 24
scene.cycles.max_bounces = 32

scene.render.resolution_x, scene.render.resolution_y = 1920, 1440
scene.render.engine = "CYCLES"

os.makedirs(os.path.dirname(out_blend), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Built {out_blend}: strokes {len(strokes.data.polygons)} faces")
