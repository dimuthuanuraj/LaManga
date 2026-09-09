#!/usr/bin/env python3
"""
Generate WebP versions of every site image.

WebP cuts the photo payload by roughly two thirds at visually identical quality,
which is the single biggest load-time win available to this site (the JPEGs were
~8.8 MB in total). The original JPEG/PNG files are kept and stay referenced as
the <img> fallback, so nothing breaks on a browser that cannot read WebP.

For each source image it writes:
  name.webp       full size, quality 80
  name-800.webp   800 px wide variant, for phones and the gallery grid

Run after adding or replacing any photo:
    python3 scripts/build-images.py
"""

import os
import glob
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
QUALITY = 80
SMALL_WIDTH = 800

converted = 0
before = 0
after_full = 0
after_small = 0

for path in sorted(glob.glob(os.path.join(ROOT, '**', '*.*'), recursive=True)):
    ext = os.path.splitext(path)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png'):
        continue

    stem = os.path.splitext(path)[0]
    src_size = os.path.getsize(path)
    before += src_size

    img = Image.open(path)
    # PNGs (the logo) keep their alpha channel; photos are flattened to RGB.
    mode = 'RGBA' if (ext == '.png' and img.mode in ('RGBA', 'LA', 'P')) else 'RGB'
    img = img.convert(mode)

    full = stem + '.webp'
    img.save(full, 'WEBP', quality=QUALITY, method=6)
    after_full += os.path.getsize(full)

    if img.width > SMALL_WIDTH:
        ratio = SMALL_WIDTH / img.width
        small = img.resize((SMALL_WIDTH, round(img.height * ratio)), Image.LANCZOS)
        small_path = stem + '-800.webp'
        small.save(small_path, 'WEBP', quality=QUALITY, method=6)
        after_small += os.path.getsize(small_path)

    converted += 1
    print('  %-44s %6.0f KB -> %6.0f KB' % (
        os.path.relpath(path, ROOT), src_size / 1024, os.path.getsize(full) / 1024))

# A browser downloads ONE variant per image, so compare each variant against
# the originals separately rather than adding them together.
print()
print('%d images converted' % converted)
print('originals        %6.2f MB' % (before / 1048576))
print('webp full size   %6.2f MB  (%.0f%% smaller)'
      % (after_full / 1048576, (1 - after_full / before) * 100))
print('webp 800 px      %6.2f MB  (%.0f%% smaller)'
      % (after_small / 1048576, (1 - after_small / before) * 100))
