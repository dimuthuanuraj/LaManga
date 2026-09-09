# Guest Reviews — Setup Guide

The Guest Reviews section is a sliding carousel driven by one file:
`public/data/google-reviews.json`. Nothing on the page calls Google at runtime,
so reviews load instantly and cost nothing per visitor.

> ⚠️ **The file currently holds 5 placeholder reviews** (`"source": "placeholder"`).
> They are sample copy, not real Google reviews. Finish step 1 below to replace
> them with the real ones.

---

## 1. Connect Featurable (gets all 45 reviews, free)

The Google Places API **only ever returns 5 reviews** — there is no official way
to pull the full history. Featurable syncs the whole set from your Google
Business Profile and serves it as free JSON, with no API key.

1. Go to <https://featurable.com> and sign up (free).
2. Connect the Google Business Profile that owns **LÁ MANGÁ, Mirissa**.
   You must be an owner or manager of that listing.
3. Create a widget for the LÁ MANGÁ location.
4. Open **Embed → API** and copy the **widget ID**.
5. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `FEATURABLE_ID`
   - Value: the widget ID from step 4
6. Go to the **Actions** tab → *Fetch Google Reviews* → **Run workflow**.

The job rewrites `public/data/google-reviews.json` with every real review and
commits it. After that it runs by itself every day at 06:00 UTC (11:30 Sri Lanka
time), so new reviews appear on the site within 24 hours of being posted.

To test it locally first:

```bash
FEATURABLE_ID=your_widget_id node scripts/fetch-reviews.js
```

---

## 2. Fallback: Google Places API (5 reviews only)

If `FEATURABLE_ID` is not set, the script falls back to the Places API using the
existing `GOOGLE_API_KEY` secret. It **merges** those 5 into whatever is already
in the JSON file rather than overwriting, so the archive still grows slowly over
time — but it will never backfill the older 40.

```bash
GOOGLE_API_KEY=your_key node scripts/fetch-reviews.js
```

---

## 3. Manual import (no third party at all)

If you would rather type the reviews in once by hand, paste them into
`scripts/reviews-source.txt`, one block per review separated by `---`:

```
Sarah Chen | 5 | 2 weeks ago
Beautiful garden, spotless rooms and the warmest hosts in Mirissa.
We will be back next season.
---
Lars Schmidt | 5 | a month ago
Wunderschöne Unterkunft, sehr freundliche Gastgeber.
```

The rating and date are optional (`Sarah Chen` on its own defaults to 5 stars).
Then run:

```bash
node scripts/import-reviews.js --rating 4.9 --total 45
```

Note: this **replaces** the whole file, so run it before connecting Featurable,
not after.

---

## How the carousel behaves

| Screen width | Cards visible |
| ------------ | ------------- |
| 1100 px and up | 3 |
| 720–1099 px | 2 |
| under 720 px | 1 |

- Advances one review at a time, every 5.5 seconds
- Pauses on hover, on keyboard focus, and when the browser tab is hidden
- Swipe left/right on touch, ← / → keys when focused, pause/play button
- Reviews over 260 characters get a **Read more** toggle
- Dots appear for 12 reviews or fewer; beyond that it shows a progress bar and
  an "n of 45" counter, so 45 reviews stay readable
- Skips animation entirely for visitors who set *reduce motion*
- The headline rating and review count also fill in the hero badge and the
  sticky booking bar, so those numbers can never go stale

## Where the numbers come from

| Shown on the page | Source field |
| ----------------- | ------------ |
| Big score (4.9) | `rating` |
| "Based on 45 Google reviews" | `totalReviews` |
| 5★/4★/3★ bars | `distribution` |
| Cards | `reviews[]` |
| "2 months ago" | recomputed in the browser from `publish_time` |

**One thing to keep in sync by hand:** the `aggregateRating` block in
`index.html` (search for `"aggregateRating"`). Google reads that for star
ratings in search results, and it must match the real numbers on the page.
