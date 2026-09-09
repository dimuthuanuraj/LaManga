/**
 * Google Reviews Carousel for LÁ MANGÁ
 *
 * Loads guest reviews from a static JSON file and presents them as a
 * sliding carousel that advances one review at a time.
 *
 * - ✅ Zero API cost per visitor (no API calls from the browser)
 * - ✅ Handles any number of reviews (5, 45, 100+)
 * - ✅ Auto-advance, pause on hover/focus, swipe on touch, keyboard arrows
 * - ✅ Respects prefers-reduced-motion
 *
 * Data file: /public/data/google-reviews.json
 * Updated by: .github/workflows/fetch-reviews.yml + scripts/import-reviews.js
 */

(function () {
    'use strict';

    const REVIEWS_JSON_URL = '/public/data/google-reviews.json';
    const AUTOPLAY_MS = 5500;
    const MAX_CHARS = 260;

    // The German page is generated from the same markup and loads the same
    // scripts, so anything rendered by JS has to be localised here too.
    const DE = document.documentElement.lang === 'de';
    const S = DE ? {
        basedOn: function (n) { return 'Basierend auf ' + n + ' Google-Bewertung' + (n === 1 ? '' : 'en'); },
        reviewsBadge: function (n) { return n + ' Bewertungen'; },
        of: 'von',
        readMore: 'Mehr lesen',
        showLess: 'Weniger anzeigen',
        postedOn: 'Auf Google veröffentlicht',
        outOf: 'von 5',
        prevNext: ['Vorherige Bewertung', 'Nächste Bewertung'],
        pause: 'Bewertungs-Slideshow pausieren',
        play: 'Bewertungs-Slideshow abspielen',
        goTo: function (i) { return 'Zu Bewertung ' + i + ' springen'; },
        ago: { day: 'vor einem Tag', days: function (n) { return 'vor ' + n + ' Tagen'; },
               week: 'vor einer Woche', weeks: function (n) { return 'vor ' + n + ' Wochen'; },
               month: 'vor einem Monat', months: function (n) { return 'vor ' + n + ' Monaten'; },
               year: 'vor einem Jahr', years: function (n) { return 'vor ' + n + ' Jahren'; } }
    } : {
        basedOn: function (n) { return 'Based on ' + n + ' Google review' + (n === 1 ? '' : 's'); },
        reviewsBadge: function (n) { return n + ' Reviews'; },
        of: 'of',
        readMore: 'Read more',
        showLess: 'Show less',
        postedOn: 'Posted on Google',
        outOf: 'out of 5',
        prevNext: ['Previous review', 'Next review'],
        pause: 'Pause review slideshow',
        play: 'Play review slideshow',
        goTo: function (i) { return 'Go to review ' + i; },
        ago: { day: 'a day ago', days: function (n) { return n + ' days ago'; },
               week: 'a week ago', weeks: function (n) { return n + ' weeks ago'; },
               month: 'a month ago', months: function (n) { return n + ' months ago'; },
               year: 'a year ago', years: function (n) { return n + ' years ago'; } }
    };

    // ===== DOM =====
    const track = document.getElementById('rc-track');
    const viewport = document.getElementById('rc-viewport');
    const carousel = document.getElementById('reviews-carousel');
    const prevBtn = document.getElementById('rc-prev');
    const nextBtn = document.getElementById('rc-next');
    const playBtn = document.getElementById('rc-play');
    const dotsEl = document.getElementById('rc-dots');
    const counterEl = document.getElementById('rc-counter');
    const progressEl = document.getElementById('rc-progress-bar');
    const avgRatingEl = document.getElementById('google-avg-rating');
    const starsEl = document.getElementById('google-stars');
    const reviewCountEl = document.getElementById('google-review-count');
    const barsEl = document.getElementById('rating-bars');
    const loadingEl = document.getElementById('reviews-loading');
    const readAllEl = document.getElementById('read-all-reviews');

    if (!track) return;

    // ===== State =====
    let reviews = [];
    let index = 0;
    let perView = 1;
    let maxIndex = 0;
    let timer = null;
    let playing = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== Load =====
    function init() {
        fetch(REVIEWS_JSON_URL + '?v=' + Date.now())
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                render(data);
            })
            .catch(function (err) {
                console.warn('Google Reviews: could not load ' + REVIEWS_JSON_URL, err.message);
                showEmptyState();
            });
    }

    function showEmptyState() {
        if (loadingEl) loadingEl.remove();
        if (carousel) carousel.style.display = 'none';
    }

    // ===== Render =====
    function render(data) {
        reviews = (data.reviews || []).filter(function (r) {
            return r && r.text && r.text.trim().length > 0;
        });

        const rating = Number(data.rating) || averageOf(reviews) || 5;
        const total = Number(data.totalReviews) || reviews.length;

        if (avgRatingEl) avgRatingEl.textContent = rating.toFixed(1);
        if (starsEl) starsEl.innerHTML = starsHtml(rating);
        if (reviewCountEl) {
            reviewCountEl.textContent = S.basedOn(total);
        }
        if (readAllEl && data.reviewsUrl) readAllEl.href = data.reviewsUrl;

        // Mirror the live numbers into the hero + sticky bar so nothing goes stale.
        syncText('[data-live="rating"]', rating.toFixed(1));
        syncText('[data-live="review-count"]', S.reviewsBadge(total));

        renderDistribution(data.distribution, reviews, total);

        if (loadingEl) loadingEl.remove();

        if (!reviews.length) {
            showEmptyState();
            return;
        }

        const frag = document.createDocumentFragment();
        reviews.forEach(function (review, i) {
            frag.appendChild(createSlide(review, i));
        });
        track.appendChild(frag);

        buildDots();
        computeLayout();
        goTo(0, true);
        bindEvents();
        if (!reduceMotion) startAutoplay();
        else setPlaying(false);
    }

    function syncText(selector, value) {
        document.querySelectorAll(selector).forEach(function (el) {
            el.textContent = value;
        });
    }

    function averageOf(list) {
        if (!list.length) return 0;
        const sum = list.reduce(function (a, r) { return a + (Number(r.rating) || 5); }, 0);
        return sum / list.length;
    }

    // ===== Rating distribution bars =====
    function renderDistribution(distribution, list, total) {
        if (!barsEl) return;

        let counts = distribution;
        if (!counts) {
            counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            list.forEach(function (r) {
                const n = Math.round(Number(r.rating) || 5);
                if (counts[n] !== undefined) counts[n]++;
            });
        }

        const sum = [5, 4, 3, 2, 1].reduce(function (a, n) { return a + (counts[n] || 0); }, 0);
        if (!sum) { barsEl.style.display = 'none'; return; }

        barsEl.innerHTML = [5, 4, 3, 2, 1].map(function (n) {
            const c = counts[n] || 0;
            const pct = Math.round((c / sum) * 100);
            return '<div class="rating-bar-row">' +
                '<span class="rb-label">' + n + '<i class="fas fa-star"></i></span>' +
                '<span class="rb-track"><span class="rb-fill" style="width:' + pct + '%"></span></span>' +
                '<span class="rb-count">' + c + '</span>' +
                '</div>';
        }).join('');
    }

    // ===== Slide =====
    function createSlide(review, i) {
        const slide = document.createElement('div');
        slide.className = 'rc-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'review');
        slide.setAttribute('aria-label', (i + 1) + ' ' + S.of + ' ' + reviews.length);

        const card = document.createElement('article');
        card.className = 'review-card visible';

        const name = review.author_name || 'Guest';
        const when = timeAgo(review.publish_time) || review.relative_time_description || '';
        const text = (review.text || '').trim();
        const isLong = text.length > MAX_CHARS;
        const shortText = isLong ? text.slice(0, MAX_CHARS).replace(/\s+\S*$/, '') + '…' : text;

        card.innerHTML =
            '<div class="review-header">' +
                '<div class="reviewer-avatar" style="background:' + avatarColor(i) + '">' +
                    (review.profile_photo_url
                        ? '<img src="' + escapeAttr(review.profile_photo_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">'
                        : '<span>' + escapeHtml(initials(name)) + '</span>') +
                '</div>' +
                '<div class="reviewer-info">' +
                    '<h4>' + escapeHtml(name) + '</h4>' +
                    '<span class="review-date">' + escapeHtml(when) + '</span>' +
                '</div>' +
                '<div class="review-rating" aria-label="' + (Number(review.rating) || 5) + ' ' + S.outOf + '">' +
                    starsHtml(Number(review.rating) || 5) +
                '</div>' +
            '</div>' +
            '<p class="review-text">' + escapeHtml(shortText) + '</p>' +
            (isLong ? '<button type="button" class="review-more">' + S.readMore + '</button>' : '') +
            '<div class="review-source">' + googleGlyph() + '<span>' + S.postedOn + '</span></div>';

        if (isLong) {
            const btn = card.querySelector('.review-more');
            const p = card.querySelector('.review-text');
            btn.addEventListener('click', function () {
                const expanded = card.classList.toggle('expanded');
                p.textContent = expanded ? text : shortText;
                btn.textContent = expanded ? S.showLess : S.readMore;
                computeLayout();
            });
        }

        slide.appendChild(card);
        return slide;
    }

    // ===== Layout =====
    function computeLayout() {
        const w = window.innerWidth;
        perView = w >= 1100 ? 3 : w >= 720 ? 2 : 1;
        if (reviews.length < perView) perView = reviews.length;
        maxIndex = Math.max(0, reviews.length - perView);

        track.style.setProperty('--rc-per-view', perView);
        if (index > maxIndex) index = maxIndex;
        position();
        updateChrome();
    }

    function position() {
        const slide = track.querySelector('.rc-slide');
        if (!slide) return;
        const step = slide.getBoundingClientRect().width;
        track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';
    }

    function goTo(i, immediate) {
        if (i < 0) i = maxIndex;
        if (i > maxIndex) i = 0;
        index = i;
        if (immediate) {
            track.style.transition = 'none';
            position();
            void track.offsetWidth;
            track.style.transition = '';
        } else {
            position();
        }
        updateChrome();
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function updateChrome() {
        if (counterEl) {
            const last = Math.min(index + perView, reviews.length);
            counterEl.textContent = (perView > 1 ? (index + 1) + '–' + last : (index + 1)) + ' ' + S.of + ' ' + reviews.length;
        }
        if (progressEl) {
            const pct = maxIndex === 0 ? 100 : ((index) / maxIndex) * 100;
            progressEl.style.width = Math.max(6, pct) + '%';
        }
        if (dotsEl) {
            dotsEl.querySelectorAll('button').forEach(function (d, i) {
                const active = i === index;
                d.classList.toggle('active', active);
                d.setAttribute('aria-current', active ? 'true' : 'false');
            });
        }
        track.querySelectorAll('.rc-slide').forEach(function (s, i) {
            const visible = i >= index && i < index + perView;
            s.setAttribute('aria-hidden', visible ? 'false' : 'true');
            s.querySelectorAll('button, a').forEach(function (el) {
                el.tabIndex = visible ? 0 : -1;
            });
        });
    }

    // Dots become unreadable past ~12 reviews, so fall back to the progress bar.
    function buildDots() {
        if (!dotsEl) return;
        if (reviews.length > 12) { dotsEl.style.display = 'none'; return; }
        dotsEl.innerHTML = '';
        for (let i = 0; i < reviews.length; i++) {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-label', S.goTo(i + 1));
            b.addEventListener('click', function () { goTo(i); restartAutoplay(); });
            dotsEl.appendChild(b);
        }
    }

    // ===== Autoplay =====
    function startAutoplay() {
        stopAutoplay();
        if (reviews.length <= perView) return;
        playing = true;
        timer = setInterval(next, AUTOPLAY_MS);
        updatePlayBtn();
    }

    function stopAutoplay() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    function pauseAutoplay() { stopAutoplay(); }
    function resumeAutoplay() { if (playing && !reduceMotion) startAutoplay(); }
    function restartAutoplay() { if (playing && !reduceMotion) startAutoplay(); }

    function setPlaying(on) {
        playing = on;
        if (on) startAutoplay(); else stopAutoplay();
        updatePlayBtn();
    }

    function updatePlayBtn() {
        if (!playBtn) return;
        playBtn.innerHTML = playing
            ? '<i class="fas fa-pause"></i>'
            : '<i class="fas fa-play"></i>';
        playBtn.setAttribute('aria-label', playing ? S.pause : S.play);
    }

    // ===== Events =====
    function bindEvents() {
        if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });
        if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });
        if (playBtn) playBtn.addEventListener('click', function () { setPlaying(!playing); });

        carousel.addEventListener('mouseenter', pauseAutoplay);
        carousel.addEventListener('mouseleave', resumeAutoplay);
        carousel.addEventListener('focusin', pauseAutoplay);
        carousel.addEventListener('focusout', resumeAutoplay);

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) pauseAutoplay(); else resumeAutoplay();
        });

        carousel.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); next(); restartAutoplay(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); restartAutoplay(); }
        });

        let debounce;
        window.addEventListener('resize', function () {
            clearTimeout(debounce);
            debounce = setTimeout(computeLayout, 150);
        });

        bindSwipe();
    }

    function bindSwipe() {
        let startX = 0, startY = 0, dragging = false, locked = false;

        viewport.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            dragging = true;
            locked = false;
            pauseAutoplay();
        }, { passive: true });

        viewport.addEventListener('touchmove', function (e) {
            if (!dragging) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (!locked && Math.abs(dx) > Math.abs(dy) + 4) locked = true;
            if (locked) {
                const slide = track.querySelector('.rc-slide');
                const step = slide ? slide.getBoundingClientRect().width : 0;
                track.style.transition = 'none';
                track.style.transform = 'translate3d(' + (-index * step + dx * 0.6) + 'px,0,0)';
            }
        }, { passive: true });

        viewport.addEventListener('touchend', function (e) {
            if (!dragging) return;
            dragging = false;
            track.style.transition = '';
            const dx = e.changedTouches[0].clientX - startX;
            if (locked && Math.abs(dx) > 45) {
                dx < 0 ? next() : prev();
            } else {
                position();
            }
            resumeAutoplay();
        });
    }

    // ===== Helpers =====
    function starsHtml(rating) {
        let html = '';
        // 4.9 should read as five stars, not four — round the tail up past .75.
        let full = Math.floor(rating);
        const frac = rating - full;
        if (frac >= 0.75) full += 1;
        const half = frac >= 0.25 && frac < 0.75;
        for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
        if (half) html += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < 5 - full - (half ? 1 : 0); i++) html += '<i class="far fa-star"></i>';
        return html;
    }

    // Recomputed on each page view so the labels stay accurate between builds,
    // instead of freezing at whatever the data file was generated with.
    function timeAgo(iso) {
        if (!iso) return '';
        const then = Date.parse(iso);
        if (!then) return '';
        const days = Math.floor((Date.now() - then) / 86400000);
        if (days < 0) return '';
        if (days <= 1) return S.ago.day;
        if (days < 7) return S.ago.days(days);
        if (days < 31) {
            const w = Math.floor(days / 7);
            return w === 1 ? S.ago.week : S.ago.weeks(w);
        }
        if (days < 365) {
            const m = Math.floor(days / 30);
            return m === 1 ? S.ago.month : S.ago.months(m);
        }
        const y = Math.floor(days / 365);
        return y === 1 ? S.ago.year : S.ago.years(y);
    }

    function initials(name) {
        return name.trim().split(/\s+/).map(function (w) { return w.charAt(0).toUpperCase(); })
            .slice(0, 2).join('') || '?';
    }

    function avatarColor(i) {
        const colors = [
            'linear-gradient(135deg,#1a4d2e,#2d7a4a)',
            'linear-gradient(135deg,#c5a880,#a68a5b)',
            'linear-gradient(135deg,#4285f4,#3367d6)',
            'linear-gradient(135deg,#34a853,#2d8e47)',
            'linear-gradient(135deg,#ea4335,#c5221f)',
            'linear-gradient(135deg,#7b5ea7,#5c4383)'
        ];
        return colors[i % colors.length];
    }

    function googleGlyph() {
        return '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>' +
            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
            '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function escapeAttr(text) {
        return escapeHtml(text).replace(/"/g, '&quot;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
