"""Step 3 of the logo rebuild: sweep round glass tubes along the traced strokes and add
cut gems for the accent dots, matching the brand liquid-glass mark.

Usage:
  blender -b --factory-startup --python scripts/logo/03_build.py -- <work_dir> <out.blend>

Reads <work_dir>/strokes.json (from 02_centerlines.py) and saves a self-contained .blend
with:
  - FiuLogo   empty with the original spin-and-settle animation (192 frames)
    - Strokes      NURBS tube sweeps, self-unioned so crossings weld along clean seams
    - GemLeft / GemRight   shallow diamond (rhombus) prisms — the flat mark's umlaut
  - one shared clear-glass material, a procedural high-key studio world, and a camera

The HQ brand refs in design/refs/ use two equal diamond dots (not a round brilliant +
baguette). The website home mockup's glass render had the wrong gem silhouettes baked in.

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

# Slightly above crown glass: stronger Fresnel darkens the tube rims the way Canva does.
IOR = 1.72

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
def glass(name, ior, colour=(1.0, 1.0, 1.0, 1.0)):
    """Clear glass. Blender 5.2's glass shaders have no dispersion input, so
    04_export.py renders the refraction three times at slightly different IORs and
    05_fallback_png.py recombines them as red, green and blue."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.remove(nodes["Principled BSDF"])
    g = nodes.new("ShaderNodeBsdfGlass")
    g.name = "Glass BSDF"
    g.inputs["Color"].default_value = colour
    g.inputs["Roughness"].default_value = 0.0
    g.inputs["IOR"].default_value = ior
    links.new(g.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


# Strokes: untinted. Gems: a light blue tint so they read clear-blue like Canva, instead of
# soaking up the orange/navy studio bands across every facet.
glass_mat = glass("Glass", IOR)
gem_mat = glass("GemGlass", IOR, colour=(0.82, 0.90, 0.98, 1.0))

# --- Strokes ------------------------------------------------------------------
# Each stroke becomes a smooth NURBS sweep with a round profile. Blunt ends get flat caps;
# pointed ends already taper to ~0 radius in strokes.json.
tubes = []
for k, stroke in enumerate(data["strokes"]):
    curve_data = bpy.data.curves.new(f"Stroke{k}", "CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_mode = "ROUND"
    curve_data.bevel_depth = 1.0
    curve_data.bevel_resolution = 8
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

# Facet the flat bar ends like cut glass rods: inset each near-planar end cap and poke a
# centre vertex so the end reads as a small radial facet cluster instead of a flat disc.
bm = bmesh.new()
bm.from_mesh(strokes.data)
bm.faces.ensure_lookup_table()
end_faces = []
for f in bm.faces:
    # Cap faces sit roughly in a plane whose normal is along the tube (in XY of the
    # logo → XZ here). They're nearly circular and face mostly along ±X/±Z, not ±Y.
    n = f.normal
    if abs(n.y) > 0.55:
        continue
    # End caps are small discs; crossings produce longer thin faces we leave alone.
    if not (0.15 < f.calc_area() < 1.2):
        continue
    # Prefer faces whose verts lie near a plane (planar cap).
    if len(f.verts) < 8:
        continue
    end_faces.append(f)
for f in list(end_faces):
    ret = bmesh.ops.inset_individual(bm, faces=[f], thickness=0.07, depth=0.0)
    inset = ret["faces"]
    if inset:
        bmesh.ops.poke(bm, faces=inset)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(strokes.data)
bm.free()

# Wider multi-segment chamfer on hard edges: crossings become gem-like facets and the
# cut ends catch dark refractive rims the way Canva's do.
bevel = strokes.modifiers.new("Chamfer", "BEVEL")
bevel.limit_method = "ANGLE"
bevel.angle_limit = math.radians(40)
bevel.width = 0.055
bevel.segments = 3
bevel.profile = 0.55
bevel.harden_normals = True
bpy.ops.object.modifier_apply(modifier=bevel.name)
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
strokes.data.materials.append(glass_mat)


# --- Gems ---------------------------------------------------------------------
def ring(bm, verts2d, depth):
    return [bm.verts.new((x, depth, z)) for x, z in verts2d]


def bridge(bm, a, b):
    n = len(a)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))


def square(side, phase=0.0):
    """Axis-aligned square corners, optionally pre-rotated in 2D by phase."""
    h = side / 2
    corners = [(-h, -h), (h, -h), (h, h), (-h, h)]
    if not phase:
        return corners
    c, s = math.cos(phase), math.sin(phase)
    return [(x * c - z * s, x * s + z * c) for x, z in corners]


def diamond_prism(name, side):
    """Shallow square step-cut, point-up in the logo plane. Matches the flat mark's
    diamond umlauts. Table faces the viewer (-Y); depth stays shallow so the gems
    read as clear glass instead of trapping light like a deep pavilion."""
    bm = bmesh.new()
    # Built as a square; the object is rotated 45° about Y so it reads as a rhombus.
    rings = [
        (0.62, -0.14),  # table
        (0.84, -0.07),
        (1.0, -0.02),  # girdle
        (1.0, 0.02),
        (0.78, 0.09),
        (0.48, 0.14),  # keel
    ]
    built = []
    for scale, d in rings:
        built.append(ring(bm, square(side * scale), d * side))
    bm.faces.new(built[0][::-1])
    for a, b in zip(built, built[1:]):
        bridge(bm, a, b)
    bm.faces.new(built[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


# Two equal diamonds from design/refs/white.png. major≈diagonal of the rhombus;
# square side before the 45° yaw is diagonal/√2. Match liquid-glass: gems ≈ stroke thick.
dots = sorted(data["dots"], key=lambda d: d["center"][0])
# major≈point-to-point diagonal on the flat mark; square side = diagonal/√2.
diag = sum(sum(d["size"]) / 2 for d in dots) / len(dots)
side = diag / math.sqrt(2)
# Point-up diamond + the mark's slight up-right slant (liquid-glass / white refs).
diamond_yaw = math.radians(45)
slant = math.radians(10)

gems = []
for i, dot in enumerate(dots):
    name = ("GemLeft", "GemRight")[i]
    obj = bpy.data.objects.new(name, diamond_prism(name, side))
    obj.location = to3d(*dot["center"])
    # Y = view-axis spin (diamond orientation); small tip toward camera.
    obj.rotation_euler = (math.radians(8), -(diamond_yaw + slant), math.radians(-4 if i else 4))
    obj.data.materials.append(gem_mat)
    scene.collection.objects.link(obj)
    gems.append(obj)

# --- Rig + animation (same timing as the original file) -------------------------
rig = bpy.data.objects.new("FiuLogo", None)
scene.collection.objects.link(rig)
for o in (strokes, *gems):
    o.parent = rig
spin = [(1, 0.0), (72, -2 * math.pi), (84, -2 * math.pi - 0.1), (96, -2 * math.pi), (168, 0.0), (180, 0.1), (192, 0.0)]
for frame, z in spin:
    rig.rotation_euler = (0, 0, z)
    rig.keyframe_insert("rotation_euler", index=2, frame=frame)
scene.frame_start, scene.frame_end = 1, 192
scene.frame_set(1)

# --- Camera, world -----------------------------------------------------------------
# Mild perspective/tilt rather than a dead-on telephoto, matching the liquid-glass mockups.
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
# Closer framing so the mark fills the frame like liquid-glass.jpg.
cam.location = (1.6, -28, 1.2)
track = cam.constraints.new("TRACK_TO")
track.target = rig
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis = "UP_Y"
scene.camera = cam

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
# Match design/refs/liquid-glass.jpg: deep red→black field, warm white/copper key lights,
# thin cool rim accents. Refracted through the tubes this yields the mockup's glow.
wn, wl = world.node_tree.nodes, world.node_tree.links


def srgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple((int(h[i : i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)) + (1,)


coord = wn.new("ShaderNodeTexCoord")
# Soft vertical gradient (Generated Z) + low-frequency noise for caustic break-up.
sep = wn.new("ShaderNodeSeparateXYZ")
wl.new(coord.outputs["Generated"], sep.inputs[0])
noise = wn.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 1.4
noise.inputs["Detail"].default_value = 1.0
noise.inputs["Distortion"].default_value = 0.7
wl.new(coord.outputs["Generated"], noise.inputs["Vector"])
# fac = 0.65*Z + 0.35*noise
mul_z = wn.new("ShaderNodeMath")
mul_z.operation = "MULTIPLY"
mul_z.inputs[1].default_value = 0.65
wl.new(sep.outputs["Z"], mul_z.inputs[0])
mul_n = wn.new("ShaderNodeMath")
mul_n.operation = "MULTIPLY"
mul_n.inputs[1].default_value = 0.35
wl.new(noise.outputs["Fac"], mul_n.inputs[0])
add = wn.new("ShaderNodeMath")
add.operation = "ADD"
wl.new(mul_z.outputs[0], add.inputs[0])
wl.new(mul_n.outputs[0], add.inputs[1])
bands = wn.new("ShaderNodeValToRGB")
wl.new(add.outputs[0], bands.inputs[0])
# Bright key bands (white/copper) on a deep red field — underexposure was washing the
# logo into silhouette against liquid-glass.jpg.
stops = [
    (0.0, "#050008"),
    (0.18, "#2a0010"),
    (0.32, "#7a0818"),
    (0.42, "#c01020"),
    (0.48, "#ffffff"),
    (0.52, "#ffe8d0"),
    (0.56, "#ff6020"),
    (0.62, "#8b0018"),
    (0.70, "#1a0820"),
    (0.78, "#ffffff"),
    (0.82, "#a8c8ff"),
    (0.88, "#100008"),
    (1.0, "#000000"),
]
els = bands.color_ramp.elements
els[0].position, els[0].color = stops[0][0], srgb(stops[0][1])
els[1].position, els[1].color = stops[-1][0], srgb(stops[-1][1])
for pos, colour in stops[1:-1]:
    els.new(pos).color = srgb(colour)
wl.new(bands.outputs[0], wn["Background"].inputs["Color"])
wn["Background"].inputs["Strength"].default_value = 3.2

# Soft key fill so tube rims catch specular the way the mockup does.
key = bpy.data.lights.new("Key", "AREA")
key.energy = 400
key.color = (1.0, 0.92, 0.85)
key.size = 20
key_obj = bpy.data.objects.new("Key", key)
key_obj.location = (8, -18, 12)
scene.collection.objects.link(key_obj)
rim = bpy.data.lights.new("Rim", "AREA")
rim.energy = 180
rim.color = (1.0, 0.55, 0.35)
rim.size = 14
rim_obj = bpy.data.objects.new("Rim", rim)
rim_obj.location = (-10, -8, 6)
scene.collection.objects.link(rim_obj)

scene.view_settings.view_transform = "Standard"
scene.cycles.transmission_bounces = 24
scene.cycles.max_bounces = 32

scene.render.resolution_x, scene.render.resolution_y = 1920, 1440
scene.render.engine = "CYCLES"

os.makedirs(os.path.dirname(out_blend) or ".", exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Built {out_blend}: strokes {len(strokes.data.polygons)} faces")
