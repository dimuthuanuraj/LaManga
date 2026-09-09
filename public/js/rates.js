/**
 * Room rates for LÁ MANGÁ
 *
 * Reads public/data/rates.json and fills the price block on each room card.
 *
 * A room with a null rate stays hidden rather than rendering an empty or
 * placeholder price — a half-filled rates file should never show a wrong
 * number to a guest. So the site works exactly as it does today until real
 * rates are entered, then the prices simply appear.
 */

(function () {
    'use strict';

    const RATES_URL = '/public/data/rates.json';

    const DE = document.documentElement.lang === 'de';
    const S = DE
        ? { from: 'ab', per: { night: 'Nacht' }, direct: 'Direktpreis' }
        : { from: 'from', per: {}, direct: 'Direct rate' };

    const slots = document.querySelectorAll('[data-price-for]');
    if (!slots.length) return;

    fetch(RATES_URL + '?v=' + Date.now())
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(render)
        .catch(function (err) {
            console.warn('Rates: could not load ' + RATES_URL, err.message);
        });

    function render(data) {
        const rooms = data.rooms || {};
        const symbol = data.symbol || '$';
        const per = data.per || 'night';
        let shown = 0;

        slots.forEach(function (slot) {
            const name = slot.getAttribute('data-price-for');
            const rate = rooms[name];

            if (rate === null || rate === undefined || rate === '' || !isFinite(Number(rate))) {
                return;
            }

            slot.innerHTML =
                '<span class="price-from">' + S.from + '</span>' +
                '<span class="price-amount">' + escapeHtml(symbol + Number(rate)) + '</span>' +
                '<span class="price-per">/ ' + escapeHtml(S.per[per] || per) + '</span>' +
                (data.showDirectBadge
                    ? '<span class="price-direct"><i class="fas fa-tag" aria-hidden="true"></i> ' +
                      escapeHtml(DE ? S.direct : (data.note || S.direct)) + '</span>'
                    : '');
            slot.hidden = false;
            shown++;
        });

        if (shown) {
            document.querySelectorAll('[data-live="from-price"]').forEach(function (el) {
                const values = Object.values(rooms)
                    .map(Number)
                    .filter(function (n) { return isFinite(n) && n > 0; });
                if (values.length) el.textContent = symbol + Math.min.apply(null, values);
            });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
})();
