"""Render the default link-preview image: the flat white mark centred on the site's ink.

Shown when a page has no picture of its own (a project shares its cover, a person their portrait) and the editors
haven't uploaded a "Default share image" in Site settings. 1200x630 is Open Graph's 1.91:1 frame.

Usage:
  python scripts/logo/07_share_image.py [design/refs/white.png] [public/brand/og.png]
"""

import sys

from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else "design/refs/white.png"
out = sys.argv[2] if len(sys.argv) > 2 else "public/brand/og.png"

WIDTH, HEIGHT = 1200, 630
# `--ink` in app/(site)/globals.css and `INK` in lib/theme.ts.
INK = (12, 11, 13)
# The mark fills this share of the frame's height: about the size it has on the launch splash.
MARK_HEIGHT = 0.5

# The alpha is the artwork; it is painted in pure white, as in 05_white_png.py. Cropped to the mark, ignoring stray haze.
alpha = Image.open(src).convert("RGBA").getchannel("A")
mark = alpha.crop(alpha.point(lambda v: 255 if v > 8 else 0).getbbox())
height = round(HEIGHT * MARK_HEIGHT)
width = round(mark.width * height / mark.height)
mark = mark.resize((width, height), Image.LANCZOS)

canvas = Image.new("RGB", (WIDTH, HEIGHT), INK)
canvas.paste((255, 255, 255), ((WIDTH - width) // 2, (HEIGHT - height) // 2), mark)
canvas.save(out, optimize=True)
print(f"Wrote {out} ({WIDTH}x{HEIGHT}), mark {width}x{height}")
