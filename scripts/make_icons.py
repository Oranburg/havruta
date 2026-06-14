#!/usr/bin/env python3
"""Generate Havruta PWA icons with Pillow.

The mark is a pair of facing open-book pages on the deep-navy brand color,
suggesting two people studying one text together. No external font is needed.

Outputs:
  public/icons/icon-192.png         (192x192)
  public/icons/icon-512.png         (512x512)
  public/icons/icon-512-maskable.png (512x512, extra safe padding)
  public/icons/apple-touch-icon.png (180x180)
"""

import os
from PIL import Image, ImageDraw

NAVY = (10, 50, 85, 255)        # #0A3255 brand navy
CREAM = (245, 242, 236, 255)    # #F5F2EC page
YELLOW = (255, 214, 92, 255)    # #FFD65C accent

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "icons")


def draw_mark(size, content_scale=1.0, rounded=True):
    """Render the icon at the given pixel size.

    content_scale shrinks the mark toward the center, leaving a wider safe
    zone for maskable icons where the platform may crop the corners.
    """
    # Supersample for clean edges, then downsample.
    ss = 4
    w = size * ss
    img = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background. Rounded for standard icons; full-bleed for maskable.
    radius = int(w * 0.20)
    if rounded:
        d.rounded_rectangle([0, 0, w - 1, w - 1], radius=radius, fill=NAVY)
    else:
        d.rectangle([0, 0, w - 1, w - 1], fill=NAVY)

    # Work in a 0..1 coordinate space centered on the canvas, scaled down by
    # content_scale so the mark sits inside a safe zone.
    cx = w / 2

    def X(u):
        return cx + (u - 0.5) * w * content_scale

    def Y(v):
        return cx + (v - 0.5) * w * content_scale

    # Two open-book pages meeting at a center spine. Each page is a polygon
    # with a gently dished top and bottom so it reads as an open book.
    left_page = [
        (X(0.50), Y(0.34)),
        (X(0.28), Y(0.29)),
        (X(0.16), Y(0.31)),
        (X(0.16), Y(0.71)),
        (X(0.28), Y(0.69)),
        (X(0.50), Y(0.74)),
    ]
    right_page = [
        (X(0.50), Y(0.34)),
        (X(0.72), Y(0.29)),
        (X(0.84), Y(0.31)),
        (X(0.84), Y(0.71)),
        (X(0.72), Y(0.69)),
        (X(0.50), Y(0.74)),
    ]
    d.polygon(left_page, fill=CREAM)
    d.polygon(right_page, fill=CREAM)

    # The center spine in yellow, the binding the pair reads across.
    spine_w = int(w * 0.018 * content_scale)
    d.line([(X(0.50), Y(0.31)), (X(0.50), Y(0.75))], fill=YELLOW, width=spine_w)

    # A few text lines on each page, in navy, to read as a written folio.
    line_w = max(1, int(w * 0.013 * content_scale))
    rows = [0.42, 0.50, 0.58]
    for v in rows:
        # Left page line, tilting toward the spine.
        d.line([(X(0.22), Y(v + 0.02)), (X(0.45), Y(v))], fill=NAVY, width=line_w)
        # Right page line, mirror.
        d.line([(X(0.55), Y(v)), (X(0.78), Y(v + 0.02))], fill=NAVY, width=line_w)

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("icon-192.png", 192, 0.80, True),
        ("icon-512.png", 512, 0.80, True),
        # Maskable: more padding (smaller content) and full-bleed background.
        ("icon-512-maskable.png", 512, 0.62, False),
        ("apple-touch-icon.png", 180, 0.80, True),
    ]
    for name, size, scale, rounded in targets:
        img = draw_mark(size, content_scale=scale, rounded=rounded)
        path = os.path.join(OUT, name)
        img.save(path, "PNG")
        print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    main()
