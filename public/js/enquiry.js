/**
 * Availability enquiry form for LÁ MANGÁ
 *
 * There is no backend and no third-party form service: the form composes a
 * complete, readable message and hands it to WhatsApp (or the guest's mail
 * client). That means an enquiry sent at 2 a.m. still arrives with the dates,
 * guest count and room already filled in, instead of a bare "hi, are you free?"
 * that needs three round trips to pin down.
 */

(function () {
    'use strict';

    const WHATSAPP_NUMBER = '94762096130';
    const EMAIL = 'info@lamangamirissa.com';

    const DE = document.documentElement.lang === 'de';
    const LOCALE = DE ? 'de-DE' : 'en-GB';
    const S = DE ? {
        night: 'Nacht', nights: 'Nächte',
        anyRoom: 'beliebiges freies Zimmer', roomSuffix: '-Zimmer',
        needName: 'Ihren Namen', needIn: 'ein Anreisedatum', needOut: 'ein Abreisedatum',
        needAfter: 'ein Abreisedatum nach Ihrem Anreisedatum',
        pleaseAdd: function (list) { return 'Bitte ergänzen Sie ' + list + '.'; },
        greeting: 'Hallo LÁ MANGÁ! Ich möchte die Verfügbarkeit anfragen.',
        name: 'Name', checkin: 'Anreise', checkout: 'Abreise',
        nightsLabel: 'Nächte', guests: 'Gäste', room: 'Zimmer',
        noPref: 'Keine Präferenz', notes: 'Hinweise',
        closing: 'Können Sie mir Verfügbarkeit und Ihren besten Direktpreis bestätigen? Vielen Dank!',
        subject: function (a, b) { return 'Buchungsanfrage — ' + a + ' bis ' + b; }
    } : {
        night: 'night', nights: 'nights',
        anyRoom: 'any available room', roomSuffix: ' room',
        needName: 'your name', needIn: 'a check-in date', needOut: 'a check-out date',
        needAfter: 'a check-out date after your check-in date',
        pleaseAdd: function (list) { return 'Please add ' + list + '.'; },
        greeting: 'Hi LÁ MANGÁ! I would like to check availability.',
        name: 'Name', checkin: 'Check-in', checkout: 'Check-out',
        nightsLabel: 'Nights', guests: 'Guests', room: 'Room',
        noPref: 'No preference', notes: 'Notes',
        closing: 'Could you confirm availability and your best direct rate? Thank you!',
        subject: function (a, b) { return 'Booking enquiry — ' + a + ' to ' + b; }
    };

    const form = document.getElementById('enquiry-form');
    if (!form) return;

    const checkin = document.getElementById('eq-checkin');
    const checkout = document.getElementById('eq-checkout');
    const guests = document.getElementById('eq-guests');
    const room = document.getElementById('eq-room');
    const name = document.getElementById('eq-name');
    const notes = document.getElementById('eq-notes');
    const summary = document.getElementById('enquiry-summary');
    const errorEl = document.getElementById('enquiry-error');
    const emailBtn = document.getElementById('eq-email');

    const MS_DAY = 86400000;

    // ---- date bounds -------------------------------------------------------

    function isoDate(d) {
        return d.toISOString().slice(0, 10);
    }

    const today = new Date();
    checkin.min = isoDate(today);
    checkout.min = isoDate(new Date(today.getTime() + MS_DAY));

    checkin.addEventListener('change', function () {
        if (!checkin.value) return;
        const nextDay = new Date(Date.parse(checkin.value) + MS_DAY);
        checkout.min = isoDate(nextDay);
        // A check-out on or before check-in is never what the guest meant.
        if (checkout.value && Date.parse(checkout.value) <= Date.parse(checkin.value)) {
            checkout.value = isoDate(nextDay);
        }
        updateSummary();
    });

    [checkout, guests, room].forEach(function (el) {
        el.addEventListener('change', updateSummary);
    });

    // ---- live summary ------------------------------------------------------

    function nights() {
        if (!checkin.value || !checkout.value) return 0;
        const n = Math.round((Date.parse(checkout.value) - Date.parse(checkin.value)) / MS_DAY);
        return n > 0 ? n : 0;
    }

    function prettyDate(value) {
        if (!value) return '';
        const d = new Date(value + 'T00:00:00');
        return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function updateSummary() {
        const n = nights();
        if (!n) { summary.textContent = ''; return; }
        const roomText = room.value ? room.value + S.roomSuffix : S.anyRoom;
        summary.textContent = n + ' ' + (n === 1 ? S.night : S.nights) + ' · ' +
            prettyDate(checkin.value) + ' → ' + prettyDate(checkout.value) + ' · ' +
            guests.options[guests.selectedIndex].text + ' · ' + roomText;
    }

    // ---- validation --------------------------------------------------------

    function validate() {
        const problems = [];
        if (!name.value.trim()) problems.push(S.needName);
        if (!checkin.value) problems.push(S.needIn);
        if (!checkout.value) problems.push(S.needOut);
        if (checkin.value && checkout.value && nights() < 1) {
            problems.push(S.needAfter);
        }

        if (problems.length) {
            errorEl.textContent = S.pleaseAdd(problems.join(', '));
            errorEl.hidden = false;
            return false;
        }
        errorEl.hidden = true;
        return true;
    }

    // ---- message -----------------------------------------------------------

    function buildMessage() {
        const n = nights();
        const lines = [
            S.greeting,
            '',
            S.name + ': ' + name.value.trim(),
            S.checkin + ': ' + prettyDate(checkin.value),
            S.checkout + ': ' + prettyDate(checkout.value),
            S.nightsLabel + ': ' + n,
            S.guests + ': ' + guests.options[guests.selectedIndex].text,
            S.room + ': ' + (room.value || S.noPref)
        ];
        if (notes.value.trim()) {
            lines.push(S.notes + ': ' + notes.value.trim());
        }
        lines.push('', S.closing);
        return lines.join('\n');
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;
        window.open(
            'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage()),
            '_blank',
            'noopener'
        );
    });

    emailBtn.addEventListener('click', function () {
        if (!validate()) return;
        const subject = S.subject(prettyDate(checkin.value), prettyDate(checkout.value));
        window.location.href = 'mailto:' + EMAIL +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(buildMessage());
    });

    // Clear the error as soon as the guest starts fixing it.
    [name, checkin, checkout].forEach(function (el) {
        el.addEventListener('input', function () {
            if (!errorEl.hidden) errorEl.hidden = true;
        });
    });

    // Room cards deep-link into the form with that room preselected.
    document.querySelectorAll('[data-enquire-room]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            room.value = this.getAttribute('data-enquire-room');
            updateSummary();
        });
    });
})();
