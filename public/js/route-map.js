/**
 * Route map for LÁ MANGÁ
 *
 * Draws the 520 m road route from the Galle–Matara main road (A2) /
 * Udupila Road junction to the property.
 *
 * Google's key-free directions embed (saddr/daddr + output=embed) no longer
 * renders inside an iframe, so the path is drawn here instead. The geometry
 * below is the real road centreline, so the line follows the actual lanes
 * rather than a straight "as the crow flies" hop.
 *
 * Leaflet is loaded on demand the first time the Route tab is opened, so
 * visitors who never open it pay nothing for it.
 */

(function () {
    'use strict';

    const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

    const HOTEL = [5.948424, 80.461815];
    const JUNCTION = [5.9456916, 80.4596395];

    // Road centreline, junction -> property (lat, lng).
    const ROUTE = [
        [5.945692, 80.459640], [5.945932, 80.459770], [5.946203, 80.459919],
        [5.946414, 80.460167], [5.946661, 80.460409], [5.947377, 80.460875],
        [5.947597, 80.460931], [5.947791, 80.460978], [5.948297, 80.461018],
        [5.948755, 80.461086], [5.948976, 80.461171], [5.949033, 80.461557],
        [5.949082, 80.461842], [5.948951, 80.462093]
    ];

    const LANDMARKS = [
        { pos: [5.947674, 80.461028], label: 'Coco Gate' },
        { pos: [5.947205, 80.461781], label: 'Dewmini Roti Shop' }
    ];

    const DE = document.documentElement.lang === 'de';
    const S = DE ? {
        start: '<strong>Startpunkt</strong><br>Hauptstraße Galle&ndash;Matara (A2) &times; Udupila Road',
        hotel: '<strong>LÁ MANGÁ</strong><br>Withanagoda Road, Madina Watta, Udupila',
        junctionTitle: 'Kreuzung Galle Road / Udupila Road',
        failed: 'Die Karte konnte nicht geladen werden. Nutzen Sie den Button ' +
                '<strong>Diese Route navigieren</strong> unten oder folgen Sie der Wegbeschreibung.'
    } : {
        start: '<strong>Start here</strong><br>Galle&ndash;Matara main road (A2) &times; Udupila Road',
        hotel: '<strong>LÁ MANGÁ</strong><br>Withanagoda Road, Madina Watta, Udupila',
        junctionTitle: 'Galle Road / Udupila Road junction',
        failed: 'Map could not be loaded. Use the <strong>Navigate This Route</strong> ' +
                'button below, or follow the written directions.'
    };

    let started = false;

    function loadLeaflet() {
        return new Promise(function (resolve, reject) {
            if (window.L) return resolve();

            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = LEAFLET_CSS;
            document.head.appendChild(css);

            const js = document.createElement('script');
            js.src = LEAFLET_JS;
            js.onload = resolve;
            js.onerror = function () { reject(new Error('Leaflet failed to load')); };
            document.head.appendChild(js);
        });
    }

    function pinIcon(L, color, glyph) {
        return L.divIcon({
            className: 'route-pin',
            html: '<span class="route-pin-dot" style="background:' + color + '">' + glyph + '</span>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    function build() {
        const el = document.getElementById('route-map');
        if (!el) return;
        const L = window.L;

        el.innerHTML = '';

        const map = L.map(el, {
            scrollWheelZoom: false,   // don't hijack page scrolling
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // White casing under the route line keeps it readable over any tile.
        L.polyline(ROUTE, { color: '#ffffff', weight: 10, opacity: 0.9 }).addTo(map);
        L.polyline(ROUTE, { color: '#1a4d2e', weight: 5, opacity: 1, lineCap: 'round' }).addTo(map);

        L.marker(JUNCTION, { icon: pinIcon(L, '#c5a880', '<i class="fas fa-flag"></i>'), title: S.junctionTitle })
            .addTo(map)
            .bindPopup(S.start);

        L.marker(HOTEL, { icon: pinIcon(L, '#1a4d2e', '<i class="fas fa-bed"></i>'), title: 'LÁ MANGÁ' })
            .addTo(map)
            .bindPopup(S.hotel)
            .openPopup();

        LANDMARKS.forEach(function (lm) {
            L.circleMarker(lm.pos, {
                radius: 5,
                color: '#ffffff',
                weight: 2,
                fillColor: '#d4af37',
                fillOpacity: 1
            }).addTo(map).bindTooltip(lm.label, { direction: 'top' });
        });

        map.fitBounds(L.latLngBounds(ROUTE), { padding: [45, 45] });

        // Click once to enable wheel zoom, so scrolling past the map still works.
        map.once('click', function () { map.scrollWheelZoom.enable(); });

        // The container is hidden until the tab opens, so Leaflet needs a nudge.
        setTimeout(function () { map.invalidateSize(); }, 60);
    }

    function start() {
        if (started) return;
        started = true;
        loadLeaflet().then(build).catch(function (err) {
            console.warn('Route map:', err.message);
            const el = document.getElementById('route-map');
            if (el) {
                el.innerHTML = '<p class="route-map-fallback">' + S.failed + '</p>';
            }
        });
    }

    const routeTab = document.getElementById('tab-route');
    if (routeTab) routeTab.addEventListener('click', start);
})();
