#!/usr/bin/env python3
"""
Turn the per-room HEIC photo folders under Images/<Room>/<Room>/ into
web-ready images under public/images/<room>/.

The originals are iPhone HEICs at 2268x4032 — unusable on the web both for
format and for size. This writes a 1200x1600-max JPEG (the universal fallback),
a full-size WebP and an 800 px WebP for each, matching what
scripts/build-images.py produces for the rest of the site.

The ORDER of each list matters: the first photo becomes the room card image,
so it should be the one that best shows the bed.

Run:  python3 scripts/build-room-images.py
"""

import os
import pillow_heif
from PIL import Image

pillow_heif.register_heif_opener()

ROOT = os.path.join(os.path.dirname(__file__), '..')
MAX_SIZE = (1200, 1600)
SMALL_WIDTH = 800
JPEG_QUALITY = 85
WEBP_QUALITY = 80

# Hero shot first — see the note above.
ROOMS = {
    'olive':  ('Olive',  ['IMG_9123', 'IMG_9108', 'IMG_9118', 'IMG_9115', 'IMG_9114', 'IMG_9122']),
    'garden': ('Garden', ['IMG_9100', 'IMG_9108', 'IMG_9109', 'IMG_9110', 'IMG_9112', 'IMG_9099', 'IMG_9113']),
    'sea':    ('Sea',    ['IMG_9127', 'IMG_9128', 'IMG_9126', 'IMG_9125', 'IMG_9131', 'IMG_9115']),
}

for slug, (folder, names) in ROOMS.items():
    src_dir = os.path.join(ROOT, 'Images', folder, folder)
    out_dir = os.path.join(ROOT, 'public', 'images', slug)
    os.makedirs(out_dir, exist_ok=True)

    written = 0
    for i, name in enumerate(names, start=1):
        src = os.path.join(src_dir, name + '.heic')
        if not os.path.exists(src):
            print('  missing, skipped: %s' % src)
            continue

        img = Image.open(src).convert('RGB')
        img.thumbnail(MAX_SIZE, Image.LANCZOS)

        stem = os.path.join(out_dir, str(i))
        img.save(stem + '.jpg', 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        img.save(stem + '.webp', 'WEBP', quality=WEBP_QUALITY, method=6)

        if img.width > SMALL_WIDTH:
            ratio = SMALL_WIDTH / img.width
            small = img.resize((SMALL_WIDTH, round(img.height * ratio)), Image.LANCZOS)
            small.save(stem + '-800.webp', 'WEBP', quality=WEBP_QUALITY, method=6)

        written += 1

    print('%-7s %d photos -> public/images/%s/' % (folder, written, slug))
