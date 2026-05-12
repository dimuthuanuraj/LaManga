/**
 * Fetch Google Reviews Script
 * 
 * This script runs via GitHub Actions (daily cron) to fetch
 * the latest Google reviews and save them as a static JSON file.
 * 
 * The website then loads this JSON file — zero API cost per visitor.
 * 
 * Usage:
 *   GOOGLE_API_KEY=your_key PLACE_ID=ChIJ... node scripts/fetch-reviews.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_API_KEY;
const PLACE_ID = process.env.PLACE_ID || 'ChIJSSh5EMs_4ToRG2erPYwrHW8';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'google-reviews.json');

if (!API_KEY) {
    console.error('ERROR: GOOGLE_API_KEY environment variable is not set.');
    console.error('Set it as a GitHub secret or pass it directly:');
    console.error('  GOOGLE_API_KEY=your_key node scripts/fetch-reviews.js');
    process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Fetch reviews using Google Places API (New)
const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=rating,userRatingCount,reviews&key=${API_KEY}`;

console.log(`Fetching reviews for Place ID: ${PLACE_ID}`);

const options = {
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews.rating,reviews.text.text,reviews.authorAttribution.displayName,reviews.authorAttribution.photoUri,reviews.relativePublishTimeDescription,reviews.publishTime'
    }
};

https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`API returned status ${res.statusCode}:`);
            console.error(data);
            
            // If we have an existing file, keep it rather than failing
            if (fs.existsSync(OUTPUT_PATH)) {
                console.log('Keeping existing reviews file.');
                process.exit(0);
            }
            process.exit(1);
        }
        
        try {
            const apiData = JSON.parse(data);
            
            // Transform API response into our format
            const reviewData = {
                lastUpdated: new Date().toISOString(),
                placeId: PLACE_ID,
                rating: apiData.rating || 5.0,
                totalReviews: apiData.userRatingCount || 0,
                reviews: (apiData.reviews || []).map(review => ({
                    author_name: review.authorAttribution?.displayName || 'Guest',
                    profile_photo_url: review.authorAttribution?.photoUri || '',
                    rating: review.rating || 5,
                    relative_time_description: review.relativePublishTimeDescription || '',
                    text: review.text?.text || '',
                    publish_time: review.publishTime || ''
                }))
            };
            
            // Write to file
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reviewData, null, 2), 'utf8');
            
            console.log(`✅ Successfully fetched ${reviewData.reviews.length} reviews`);
            console.log(`   Rating: ${reviewData.rating}/5 (${reviewData.totalReviews} total reviews)`);
            console.log(`   Saved to: ${OUTPUT_PATH}`);
            
        } catch (parseError) {
            console.error('Failed to parse API response:', parseError.message);
            if (fs.existsSync(OUTPUT_PATH)) {
                console.log('Keeping existing reviews file.');
                process.exit(0);
            }
            process.exit(1);
        }
    });
}).on('error', (err) => {
    console.error('Request failed:', err.message);
    if (fs.existsSync(OUTPUT_PATH)) {
        console.log('Keeping existing reviews file.');
        process.exit(0);
    }
    process.exit(1);
});
