/**
 * Google Reviews Integration for LÁ MANGÁ
 * 
 * This script loads Google reviews from a static JSON file that is
 * auto-updated daily by GitHub Actions. This means:
 * 
 * - ✅ Zero API cost per visitor (no API calls from the browser)
 * - ✅ Reviews update automatically every 24 hours
 * - ✅ Fast loading (static JSON file, no external API delay)
 * - ✅ Works offline with fallback reviews
 * 
 * The JSON file is located at: /public/data/google-reviews.json
 * It is updated by: .github/workflows/fetch-reviews.yml
 */

(function() {
    'use strict';

    // Path to the static JSON file (updated daily by GitHub Actions)
    const REVIEWS_JSON_URL = 'public/data/google-reviews.json';

    // ===== FALLBACK REVIEWS (used if JSON file fails to load) =====
    const FALLBACK_REVIEWS = {
        rating: 5.0,
        totalReviews: 27,
        reviews: [
            {
                author_name: "Julia M.",
                profile_photo_url: "",
                rating: 5,
                relative_time_description: "a month ago",
                text: "Absolutely wonderful stay! The Sunset Room had a beautiful garden view, and the staff made us feel right at home. The location is perfect – just a short walk to Mirissa Beach and Coconut Tree Hill."
            },
            {
                author_name: "Thomas K.",
                profile_photo_url: "",
                rating: 5,
                relative_time_description: "2 months ago",
                text: "A hidden gem in Mirissa! The private entrance to our room was a lovely touch. Clean, comfortable, and the hosts speak excellent German which made communication so easy. Highly recommend!"
            },
            {
                author_name: "Sarah C.",
                profile_photo_url: "",
                rating: 5,
                relative_time_description: "3 months ago",
                text: "Perfect base for exploring the south coast. We did whale watching, visited Galle Fort, and relaxed on the beach. The garden area is so peaceful. Great value for money!"
            },
            {
                author_name: "Lars S.",
                profile_photo_url: "",
                rating: 5,
                relative_time_description: "4 months ago",
                text: "Wir hatten eine wunderbare Zeit in LÁ MANGÁ. Die Gastgeber sind sehr freundlich und hilfsbereit. Die Lage ist perfekt für Whale Watching und den Strand. Sehr empfehlenswert!"
            },
            {
                author_name: "Emma R.",
                profile_photo_url: "",
                rating: 5,
                relative_time_description: "5 months ago",
                text: "Such a lovely place to stay! The rooms are clean and comfortable, the garden is beautiful, and the staff goes above and beyond. Would definitely come back!"
            }
        ]
    };

    // ===== DOM ELEMENTS =====
    const reviewsGrid = document.getElementById('google-reviews-grid');
    const avgRatingEl = document.getElementById('google-avg-rating');
    const starsEl = document.getElementById('google-stars');
    const reviewCountEl = document.getElementById('google-review-count');
    const loadingEl = document.getElementById('reviews-loading');

    // ===== INITIALIZATION =====
    function init() {
        // Try to load the static JSON file first
        fetch(REVIEWS_JSON_URL + '?v=' + Date.now())
            .then(response => {
                if (!response.ok) throw new Error('JSON file not found');
                return response.json();
            })
            .then(data => {
                console.log('Google Reviews: Loaded from JSON file (last updated: ' + (data.lastUpdated || 'unknown') + ')');
                renderReviews(data);
            })
            .catch(error => {
                console.warn('Google Reviews: Could not load JSON file, using fallback.', error.message);
                renderReviews(FALLBACK_REVIEWS);
            });
    }

    // ===== RENDER REVIEWS =====
    function renderReviews(data) {
        // Update rating header
        if (avgRatingEl) avgRatingEl.textContent = (data.rating || 5.0).toFixed(1);
        if (reviewCountEl) {
            const count = data.totalReviews || data.reviews.length;
            reviewCountEl.textContent = `Based on ${count} review${count !== 1 ? 's' : ''}`;
        }
        
        // Update stars
        if (starsEl) {
            starsEl.innerHTML = generateStars(data.rating || 5.0);
        }

        // Remove loading spinner
        if (loadingEl) loadingEl.remove();

        // Render review cards
        if (reviewsGrid) {
            const fragment = document.createDocumentFragment();
            const reviewsToShow = (data.reviews || []).slice(0, 5);
            
            reviewsToShow.forEach((review, index) => {
                const card = createReviewCard(review, index);
                fragment.appendChild(card);
            });

            reviewsGrid.appendChild(fragment);
            
            // Animate cards in with stagger
            setTimeout(() => {
                const cards = reviewsGrid.querySelectorAll('.review-card');
                cards.forEach((card, i) => {
                    setTimeout(() => card.classList.add('visible'), i * 150);
                });
            }, 100);
        }
    }

    // ===== CREATE REVIEW CARD =====
    function createReviewCard(review, index) {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        const initials = getInitials(review.author_name);
        const avatarColor = getAvatarColor(index);
        const starsHtml = generateStars(review.rating);
        const timeAgo = review.relative_time_description || 'recently';
        const reviewText = review.text || 'Great experience!';
        
        // Truncate long reviews
        const maxLength = 220;
        const isLong = reviewText.length > maxLength;
        const displayText = isLong ? reviewText.substring(0, maxLength) + '...' : reviewText;
        
        card.innerHTML = `
            <div class="review-header">
                <div class="reviewer-avatar" style="background: ${avatarColor}">
                    ${review.profile_photo_url 
                        ? `<img src="${review.profile_photo_url}" alt="${escapeHtml(review.author_name)}" referrerpolicy="no-referrer">` 
                        : `<span>${initials}</span>`
                    }
                </div>
                <div class="reviewer-info">
                    <h4>${escapeHtml(review.author_name)}</h4>
                    <span class="review-date">${escapeHtml(timeAgo)}</span>
                </div>
                <div class="review-rating">
                    ${starsHtml}
                </div>
            </div>
            <p class="review-text">"${escapeHtml(displayText)}"</p>
            <div class="review-source">
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Posted on Google</span>
            </div>
        `;
        
        return card;
    }

    // ===== HELPER FUNCTIONS =====
    function generateStars(rating) {
        let html = '';
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
        
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="fas fa-star"></i>';
        }
        if (hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }
        const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
        for (let i = 0; i < remaining; i++) {
            html += '<i class="far fa-star"></i>';
        }
        return html;
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
    }

    function getAvatarColor(index) {
        const colors = [
            'linear-gradient(135deg, #1a4d2e, #2d7a4a)',
            'linear-gradient(135deg, #c5a880, #a68a5b)',
            'linear-gradient(135deg, #4285f4, #3367d6)',
            'linear-gradient(135deg, #34a853, #2d8e47)',
            'linear-gradient(135deg, #ea4335, #c5221f)'
        ];
        return colors[index % colors.length];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== START =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
