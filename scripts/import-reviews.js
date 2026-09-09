/**
 * Import Google Reviews from a plain-text paste
 *
 * WHY THIS EXISTS
 * ---------------
 * The Google Places API only ever returns the 5 "most relevant" reviews —
 * there is no official way to pull all 45. So the full set is entered once
 * by hand here, and scripts/fetch-reviews.js then keeps it topped up daily
 * with whatever new reviews the API exposes.
 *
 * HOW TO USE
 * ----------
 * 1. Open your Google Business Profile (or the reviews panel on Google Maps)
 *    and copy each review.
 * 2. Put them in scripts/reviews-source.txt using this format — one block per
 *    review, blocks separated by a line containing only ---
 *
 *      Sarah Chen | 5 | 2 weeks ago
 *      Beautiful garden, spotless rooms and the warmest hosts in Mirissa.
 *      We will be back next season.
 *      ---
 *      Lars Schmidt | 5 | a month ago
 *      Wunderschöne Unterkunft, sehr freundliche Gastgeber.
 *
 *    The rating and date are optional: "Sarah Chen" alone works and defaults
 *    to 5 stars. Use "| de" as a 4th field to tag the language.
 *
 * 3. Run:  node scripts/import-reviews.js
 *    Add --rating 4.9 --total 45 to set the headline numbers explicitly.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, 'reviews-source.txt');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'google-reviews.json');
const PLACE_ID = process.env.PLACE_ID || 'ChIJSSh5EMs_4ToRG2erPYwrHW8';

const args = process.argv.slice(2);
function arg(name) {
    const i = args.indexOf('--' + name);
    return i !== -1 ? args[i + 1] : null;
}

if (!fs.existsSync(SOURCE_PATH)) {
    console.error('No source file at: ' + SOURCE_PATH);
    console.error('Create it and paste your reviews (see the header of this file for the format).');
    process.exit(1);
}

const raw = fs.readFileSync(SOURCE_PATH, 'utf8');

const blocks = raw
    .split(/^\s*---+\s*$/m)
    .map(b => b.trim())
    .filter(Boolean);

const reviews = [];
const seen = new Set();

blocks.forEach((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    const header = lines[0].split('|').map(s => s.trim());
    const author = header[0] || 'Guest';
    const rating = Number(header[1]) >= 1 && Number(header[1]) <= 5 ? Number(header[1]) : 5;
    const when = header[2] || '';
    const language = header[3] || '';

    const text = lines.slice(1).join(' ').trim();

    if (!text) {
        console.warn(`  ⚠  Block ${i + 1} ("${author}") has no review text — skipped.`);
        return;
    }

    const key = (author + '::' + text.slice(0, 60)).toLowerCase();
    if (seen.has(key)) {
        console.warn(`  ⚠  Duplicate review from "${author}" — skipped.`);
        return;
    }
    seen.add(key);

    reviews.push({
        author_name: author,
        profile_photo_url: '',
        rating,
        relative_time_description: when,
        text,
        publish_time: '',
        language,
        source: 'google'
    });
});

if (!reviews.length) {
    console.error('No reviews parsed. Check the format of reviews-source.txt.');
    process.exit(1);
}

const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
reviews.forEach(r => { distribution[r.rating]++; });

const average = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;

const data = {
    lastUpdated: new Date().toISOString(),
    placeId: PLACE_ID,
    rating: Number(arg('rating')) || Math.round(average * 10) / 10,
    totalReviews: Number(arg('total')) || reviews.length,
    reviewsUrl: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    writeReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    distribution,
    reviews
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Imported ${reviews.length} reviews`);
console.log(`   Headline rating: ${data.rating} / 5  ·  total shown: ${data.totalReviews}`);
console.log(`   Distribution: ${[5, 4, 3, 2, 1].map(n => n + '★:' + distribution[n]).join('  ')}`);
console.log(`   Written to: ${OUTPUT_PATH}`);
