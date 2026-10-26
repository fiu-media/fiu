"""Step 4 of the logo rebuild: export web assets from the rebuilt .blend.

Usage:
  blender -b design/fiu-logo-glass.blend --python scripts/logo/04_export.py -- <work_dir> <public_brand_dir>

Writes:
  <public_brand_dir>/fiu-logo.glb   Draco-compressed strokes + gems at rest pose (no animation;
                                    the spin is recreated in code). x right, y up, facing +z.
  <work_dir>/pass-highlights.png       glass rendered see-through (reflections/highlights only)
  <work_dir>/pass-refraction-{r,g,b}.png  glass rendered solid at three IORs, for dispersion
05_fallback_png.py combines the passes into the PNG logos.
"""

import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
work, brand = os.path.abspath(args[0]), os.path.abspath(args[1])
os.makedirs(work, exist_ok=True)
os.makedirs(brand, exist_ok=True)

scene = bpy.context.scene
scene.frame_set(1)

# --- GLB ---------------------------------------------------------------------
rig = bpy.data.objects["FiuLogo"]
bpy.ops.object.select_all(action="DESELECT")
for child in rig.children:
    child.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(brand, "fiu-logo.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
    export_normals=True,
    export_texcoords=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=10,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
)

# --- Render passes -------------------------------------------------------------
scene.render.engine = "CYCLES"
scene.cycles.samples = 256
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = 2400, 1800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "16"

try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception:
    pass

# Dispersion: red bends least, blue most. Gems get a third of the spread (see 03_build.py).
spreads = {"Glass": 0.03, "GemGlass": 0.01}
iors = {name: bpy.data.materials[name].node_tree.nodes["Glass BSDF"].inputs["IOR"] for name in spreads}
base = {name: socket.default_value for name, socket in iors.items()}
passes = [("highlights", True, 0), ("refraction-r", False, -1), ("refraction-g", False, 0), ("refraction-b", False, 1)]
for name, transparent_glass, direction in passes:
    scene.cycles.film_transparent_glass = transparent_glass
    for mat, socket in iors.items():
        socket.default_value = base[mat] + direction * spreads[mat]
    scene.render.filepath = os.path.join(work, f"pass-{name}.png")
    bpy.ops.render.render(write_still=True)
for mat, socket in iors.items():
    socket.default_value = base[mat]

print(f"Exported GLB to {brand} and render passes to {work}")
