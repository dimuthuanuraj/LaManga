/**
 * Fetch Google Reviews Script
 *
 * Runs via GitHub Actions (daily cron) to pull the latest Google reviews and
 * keep public/data/google-reviews.json up to date. The website loads that
 * static file — zero API cost and no third-party request per visitor.
 *
 * TWO SOURCES, IN PRIORITY ORDER
 * ------------------------------
 * 1. Featurable  (FEATURABLE_ID)  — returns the FULL review history.
 *    The Google Places API hard-caps at 5 reviews per request, so it can never
 *    give us all 45. Featurable syncs the whole set from the Google Business
 *    Profile and serves it as free JSON, no API key required.
 *      Setup: sign up at featurable.com → connect the Google Business Profile
 *      → create a widget → Embed → API → copy the widget ID.
 *
 * 2. Google Places API  (GOOGLE_API_KEY)  — the 5 most relevant reviews.
 *    Used when no Featurable ID is configured. Results are MERGED into whatever
 *    is already in the JSON file so the archive grows instead of shrinking to 5.
 *
 * Usage:
 *   FEATURABLE_ID=abc123 node scripts/fetch-reviews.js
 *   GOOGLE_API_KEY=your_key node scripts/fetch-reviews.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FEATURABLE_ID = process.env.FEATURABLE_ID;
const API_KEY = process.env.GOOGLE_API_KEY;
const PLACE_ID = process.env.PLACE_ID || 'ChIJSSh5EMs_4ToRG2erPYwrHW8';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'google-reviews.json');

if (!FEATURABLE_ID && !API_KEY) {
    console.error('ERROR: set FEATURABLE_ID (preferred, returns all reviews)');
    console.error('       or GOOGLE_API_KEY (Places API, capped at 5 reviews).');
    process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

// ---------------------------------------------------------------- helpers

function getJson(url, headers) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: headers || {} }, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 400)}`));
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error('Invalid JSON in response: ' + e.message));
                }
            });
        }).on('error', reject);
    });
}

function loadExisting() {
    if (!fs.existsSync(OUTPUT_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    } catch (e) {
        console.warn('Existing reviews file is not valid JSON, ignoring it:', e.message);
        return null;
    }
}

function keyOf(review) {
    return ((review.author_name || '') + '::' + (review.text || '').slice(0, 60))
        .toLowerCase().replace(/\s+/g, ' ').trim();
}

// The site recomputes "2 months ago" in the browser from publish_time, so this
// is only a sensible fallback for entries that arrive without a timestamp.
function relativeTime(iso) {
    if (!iso) return '';
    const then = Date.parse(iso);
    if (!then) return '';
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days < 7) return days <= 1 ? 'a day ago' : days + ' days ago';
    if (days < 31) {
        const w = Math.floor(days / 7);
        return w === 1 ? 'a week ago' : w + ' weeks ago';
    }
    if (days < 365) {
        const m = Math.floor(days / 30);
        return m === 1 ? 'a month ago' : m + ' months ago';
    }
    const y = Math.floor(days / 365);
    return y === 1 ? 'a year ago' : y + ' years ago';
}

function buildFile(reviews, rating, total) {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
        const n = Math.round(Number(r.rating) || 5);
        if (distribution[n] !== undefined) distribution[n]++;
    });

    return {
        lastUpdated: new Date().toISOString(),
        placeId: PLACE_ID,
        rating: Math.round((rating || 5) * 10) / 10,
        totalReviews: total || reviews.length,
        reviewsUrl: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
        writeReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
        distribution,
        reviews
    };
}

function write(data) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ ${data.reviews.length} review(s) stored`);
    console.log(`   Rating: ${data.rating}/5 (${data.totalReviews} reviews on Google)`);
    console.log(`   Saved to: ${OUTPUT_PATH}`);
}

function bail(message) {
    console.error(message);
    if (fs.existsSync(OUTPUT_PATH)) {
        console.log('Keeping the existing reviews file rather than failing the build.');
        process.exit(0);
    }
    process.exit(1);
}

// ---------------------------------------------------------------- sources

async function fromFeaturable() {
    const url = `https://api.featurable.com/v1/widgets/${FEATURABLE_ID}`;
    console.log(`Fetching all reviews from Featurable widget ${FEATURABLE_ID}`);

    const data = await getJson(url);

    // Featurable answers 200 with success:false for bad IDs, so check the flag.
    if (!data.success) {
        const err = data.error || {};
        throw new Error(`Featurable: ${err.key || 'unknown_error'} — ${err.message || 'no message'}`);
    }

    const reviews = (data.reviews || []).map((r) => ({
        author_name: (r.reviewer && r.reviewer.displayName) || 'Guest',
        profile_photo_url: (r.reviewer && r.reviewer.profilePhotoUrl) || '',
        rating: Number(r.starRating) || 5,
        relative_time_description: relativeTime(r.createTime || r.updateTime),
        text: (r.comment || '').trim(),
        publish_time: r.createTime || r.updateTime || '',
        language: '',
        source: 'featurable'
    })).filter((r) => r.text);

    reviews.sort((a, b) => (Date.parse(b.publish_time) || 0) - (Date.parse(a.publish_time) || 0));

    return buildFile(reviews, data.averageRating, data.totalReviewCount);
}

async function fromPlacesApi() {
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?key=${API_KEY}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': [
            'rating',
            'userRatingCount',
            'reviews.rating',
            'reviews.text.text',
            'reviews.originalText.text',
            'reviews.originalText.languageCode',
            'reviews.authorAttribution.displayName',
            'reviews.authorAttribution.photoUri',
            'reviews.relativePublishTimeDescription',
            'reviews.publishTime'
        ].join(',')
    };

    console.log(`Fetching reviews from the Places API for ${PLACE_ID} (max 5)`);
    const apiData = await getJson(url, headers);

    const fetched = (apiData.reviews || []).map((review) => ({
        author_name: review.authorAttribution?.displayName || 'Guest',
        profile_photo_url: review.authorAttribution?.photoUri || '',
        rating: review.rating || 5,
        relative_time_description: review.relativePublishTimeDescription || '',
        text: (review.text?.text || review.originalText?.text || '').trim(),
        publish_time: review.publishTime || '',
        language: review.originalText?.languageCode || '',
        source: 'google'
    })).filter((r) => r.text);

    // Merge into whatever is already stored, so the archive keeps growing.
    const existing = loadExisting();
    const existingReviews = (existing && Array.isArray(existing.reviews))
        ? existing.reviews.filter((r) => r.source !== 'placeholder')
        : [];

    const merged = new Map();
    existingReviews.forEach((r) => merged.set(keyOf(r), r));

    let added = 0;
    fetched.forEach((r) => {
        const key = keyOf(r);
        if (merged.has(key)) merged.set(key, Object.assign({}, merged.get(key), r));
        else { merged.set(key, r); added++; }
    });

    const reviews = Array.from(merged.values())
        .sort((a, b) => (Date.parse(b.publish_time) || 0) - (Date.parse(a.publish_time) || 0));

    console.log(`   ${added} new review(s) from this run`);

    return buildFile(
        reviews,
        apiData.rating || (existing && existing.rating),
        apiData.userRatingCount || (existing && existing.totalReviews)
    );
}

// ---------------------------------------------------------------- run

(async function main() {
    try {
        if (FEATURABLE_ID) {
            write(await fromFeaturable());
            return;
        }
        write(await fromPlacesApi());
    } catch (err) {
        // Featurable is the preferred source, but a hiccup there shouldn't stop
        // us falling back to whatever the Places API can still give us.
        if (FEATURABLE_ID && API_KEY) {
            console.warn('Featurable failed (' + err.message + '), falling back to the Places API.');
            try {
                write(await fromPlacesApi());
                return;
            } catch (fallbackErr) {
                return bail('Places API also failed: ' + fallbackErr.message);
            }
        }
        bail(err.message);
    }
})();
