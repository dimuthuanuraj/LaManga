# Maintaining the LÁ MANGÁ site

Everything here is a static site — no server, no build step required to deploy.
The scripts below are helpers you run **only when the underlying content
changes**, then commit the result.

| I want to… | Run |
| ---------- | --- |
| Set or change room prices | edit `public/data/rates.json` (no script) |
| Add or replace a photo | `python3 scripts/build-images.py` |
| Change the per-room photos | `python3 scripts/build-room-images.py` |
| Change any page text | edit `index.html`, then `python3 scripts/build-de.py` |
| Refresh guest reviews | automatic daily — see [REVIEWS-SETUP.md](REVIEWS-SETUP.md) |

---

## Room prices

Open `public/data/rates.json` and put a nightly rate against each room:

```json
"rooms": { "Sunset": 45, "Olive": 38, "Garden": 38, "Sea": 38 }
```

The price block appears on that room card immediately — no script, no rebuild.
A room left as `null` simply shows no price, so you can publish three rates and
hold the fourth back without anything looking broken.

Prices render as **from $45 / night · Direct rate** in English and
**ab $45 / Nacht · Direktpreis** in German.

When you set real prices, also update `"priceRange"` in `index.html` (currently
`"$$"`) and re-run `scripts/build-de.py`.

---

## Photos

### General site photos

Drop the new JPEG/PNG into `public/images/` (or `public/images/gallery/`), then:

```bash
python3 scripts/build-images.py
```

This writes a `.webp` and an 800 px `-800.webp` next to every original. The
originals stay as the fallback for old browsers. Then add the `<picture>` block
in `index.html` following the pattern already used in the gallery, and re-run
`scripts/build-de.py`.

Current payload: originals 8.8 MB → 5.7 MB full-size WebP → 3.1 MB at 800 px.
Phones and the gallery grid pull the 800 px files, so the gallery alone drops
from roughly 5.1 MB to 1.7 MB.

### Per-room photos

The room folders under `Images/<Room>/<Room>/` hold the original iPhone HEIC
files. To regenerate the web versions:

```bash
python3 scripts/build-room-images.py
```

The **first filename in each list inside that script becomes the room card
photo**, so reorder the list to change which shot leads. Output lands in
`public/images/olive/`, `garden/`, `sea/` (Sunset already had a folder).

> Requires `pillow-heif`: `pip install pillow-heif`

---

## Text changes and the German page

`index.html` is the single source of truth. `de/index.html` is **generated** —
never edit it directly, your changes will be overwritten.

```bash
python3 scripts/build-de.py
```

The script copies the English page, swaps in translations, rewrites the meta
tags, canonical URL, `hreflang` pair, WhatsApp message templates and FAQ schema,
and switches the language toggle in the nav.

**If you add new text to the English page**, add the translation to the `T`
dictionary in `scripts/build-de.py`. If you forget, the script tells you:

```
3 string(s) still in English:
  - Sea view terrace
  ...
```

The English text stays in place rather than disappearing, so a missed
translation is visible, not silent.

Strings rendered by JavaScript (review dates, the enquiry form, price labels,
map popups) are translated inside the JS files themselves — they switch on
`document.documentElement.lang`, so both pages share one copy of each script.

---

## The enquiry form

`#enquiry` has no backend. It composes a complete message and hands it to
WhatsApp, or to the guest's mail client via the Email button. That means an
enquiry sent at 2 a.m. still reaches you with the dates, guest count and room
already filled in.

To point it somewhere else, edit `WHATSAPP_NUMBER` / `EMAIL` at the top of
`public/js/enquiry.js`.

If you later want enquiries to land in an inbox automatically, a service like
Formspree or Web3Forms can be dropped in without changing the form markup.

---

## Things to keep in sync by hand

These are not automated, so check them when the business details change:

- `"aggregateRating"` in `index.html` — must match the rating and review count
  actually shown on the page, or Google may drop the rich result
- `"priceRange"` in `index.html` — once real rates are set
- Walking distances in the Location section
- `sitemap.xml` `<lastmod>` dates after a significant content update

## Coordinates

The property is pinned at **5.948424, 80.461815**, used by `geo.position`,
`ICBM`, both schema blocks, the Waze link and the Copy GPS button. The route map
draws the real road centreline from the Galle Road × Udupila Road junction at
**5.9456916, 80.4596395** — 520 m, about a 1-minute drive.

If the pin ever needs correcting, update it in `index.html`,
`public/js/route-map.js` (`HOTEL`), then re-run `scripts/build-de.py`.
