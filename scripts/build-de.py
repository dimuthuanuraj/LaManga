#!/usr/bin/env python3
"""
Generate the German page (de/index.html) from the English index.html.

WHY GENERATED RATHER THAN HAND-MAINTAINED
-----------------------------------------
A second hand-written page means every content change has to be made twice, and
in practice one copy always drifts. Here the English page stays the single
source of truth: edit index.html, re-run this script, and the German page is
rebuilt with identical structure, images and scripts.

If a visible string has no translation yet, the script prints it and leaves the
English in place — so nothing silently disappears, and you can see exactly what
still needs a translation.

Run:  python3 scripts/build-de.py
"""

import io
import os
import re
import json

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'index.html')
OUT_DIR = os.path.join(ROOT, 'de')
OUT = os.path.join(OUT_DIR, 'index.html')

# ---------------------------------------------------------------- text

T = {
    # Navigation
    'About': 'Über uns',
    'Discover': 'Entdecken',
    'Rooms': 'Zimmer',
    'Reviews': 'Bewertungen',
    'Location': 'Anfahrt',
    'Availability': 'Verfügbarkeit',
    'Contact': 'Kontakt',
    'Book Now': 'Jetzt buchen',

    # Hero
    'Welcome to': 'Willkommen im',
    'Your Serene Getaway in the Heart of the South': 'Ihr ruhiger Rückzugsort im Herzen des Südens',
    'Google Reviews': 'Google-Bewertungen',
    'Book Direct & Save': 'Direkt buchen & sparen',
    '4 Luxury Rooms': '4 Komfortzimmer',
    '5 min to Beach': '5 Min. zum Strand',
    'Free WiFi': 'Kostenloses WLAN',
    'Book Your Stay': 'Jetzt anfragen',
    'Scroll': 'Mehr',

    # About
    'Experience LÁ MANGÁ': 'LÁ MANGÁ erleben',
    'Experience a calm, secure atmosphere designed to make you feel right at home.':
        'Eine ruhige, sichere Atmosphäre, in der Sie sich sofort zu Hause fühlen.',
    'Nestled just a short walk from the ocean, LÁ MANGÁ offers comfortable accommodation with modern amenities, a relaxing garden environment, and warm hospitality. We speak German and English to better serve our international guests.':
        'Nur wenige Gehminuten vom Meer entfernt bietet LÁ MANGÁ komfortable Zimmer mit moderner Ausstattung, einen erholsamen Garten und herzliche Gastfreundschaft. Wir sprechen Deutsch und Englisch und betreuen unsere internationalen Gäste persönlich.',
    'Safe & Secure': 'Sicher & geschützt',
    'German & English': 'Deutsch & Englisch',
    'Warm Hospitality': 'Herzliche Gastfreundschaft',

    # Destination
    'Explore': 'Erkunden',
    'Why Mirissa?': 'Warum Mirissa?',
    "Discover the magic of Sri Lanka's most beautiful coastal destination":
        'Entdecken Sie den Zauber der schönsten Küstenregion Sri Lankas',
    'Coconut Tree Hill': 'Coconut Tree Hill',
    'Famous crescent-shaped beach with the iconic Coconut Tree Hill — a must-visit for that perfect sunset photo.':
        'Die berühmte halbmondförmige Bucht mit dem ikonischen Coconut Tree Hill — der Ort für das perfekte Sonnenuntergangsfoto.',
    'Whale Watching': 'Walbeobachtung',
    "One of the world's best spots to see Blue Whales, Sperm Whales, and playful dolphins. Boat tours depart daily.":
        'Einer der weltbesten Orte, um Blauwale, Pottwale und verspielte Delfine zu sehen. Bootstouren starten täglich.',
    'Harbor nearby': 'Hafen ganz in der Nähe',
    'Beach Life': 'Strandleben',
    'Relax on pristine sand by day, dine at candle-lit seafood restaurants by night under the stars.':
        'Tagsüber feiner Sand, abends Fischrestaurants bei Kerzenlicht unter dem Sternenhimmel.',
    'Turtle Bay': 'Schildkrötenbucht',
    'Swim and snorkel alongside friendly sea turtles in their natural habitat at nearby Turtle Point.':
        'Schwimmen und schnorcheln Sie am nahen Turtle Point neben Meeresschildkröten in freier Natur.',
    'Short drive': 'Kurze Fahrt',
    '5 min away': '5 Min. entfernt',
    '7 min walk': '7 Min. zu Fuß',

    # Rooms
    'Accommodation': 'Unterkunft',
    'Our Rooms': 'Unsere Zimmer',
    'We offer 4 distinct rooms, each designed for comfort and privacy with modern amenities.':
        'Vier individuelle Zimmer, alle auf Komfort und Privatsphäre ausgelegt und modern ausgestattet.',
    'Popular': 'Beliebt',
    'Triple Room with Garden View': 'Dreibettzimmer mit Gartenblick',
    '3 Guests': '3 Gäste',
    '2 Guests': '2 Gäste',
    '1 Single + 1 Double': '1 Einzel- + 1 Doppelbett',
    '1 Double Bed': '1 Doppelbett',
    'AC': 'Klimaanlage',
    'Garden View': 'Gartenblick',
    'Private Bath': 'Eigenes Bad',
    'Tea/Coffee': 'Tee/Kaffee',
    'Book This Room': 'Dieses Zimmer buchen',
    'Private Entrance': 'Eigener Eingang',
    'Private Entry': 'Eigener Eingang',
    'Deluxe Double Room': 'Deluxe-Doppelzimmer',
    'WiFi': 'WLAN',

    # Gallery
    'Visual Tour': 'Bildergalerie',
    'Gallery': 'Galerie',

    # Reviews
    'Testimonials': 'Gästestimmen',
    'Guest Reviews': 'Gästebewertungen',
    'Real reviews from our guests on Google': 'Echte Bewertungen unserer Gäste auf Google',
    'Based on Google Reviews': 'Basierend auf Google-Bewertungen',
    'Loading Google reviews...': 'Google-Bewertungen werden geladen …',
    'Write a Review on Google': 'Bewertung auf Google schreiben',
    'Read All Reviews on Google': 'Alle Bewertungen auf Google lesen',

    # Facilities
    'Amenities': 'Ausstattung',
    'Facilities & Services': 'Ausstattung & Service',
    'High-speed internet throughout the property': 'Schnelles Internet auf dem gesamten Gelände',
    'Kitchen Access': 'Küchennutzung',
    'Fully equipped kitchen with refrigerator': 'Voll ausgestattete Küche mit Kühlschrank',
    'Free Parking': 'Kostenlose Parkplätze',
    'Private on-site parking for all guests': 'Private Stellplätze direkt am Haus für alle Gäste',
    'Garden': 'Garten',
    'Serene outdoor space to relax and unwind': 'Ruhiger Außenbereich zum Entspannen',
    'Air Conditioning': 'Klimaanlage',
    'Climate control in all rooms': 'Klimatisierung in allen Zimmern',
    'Private Bathrooms': 'Eigene Badezimmer',
    'En-suite with bath, shower & toiletries': 'Eigenes Bad mit Dusche und Pflegeprodukten',

    # Restaurant
    'Dining Experience': 'Kulinarik',
    'Our partner restaurant serving authentic Sri Lankan & international cuisine':
        'Unser Partnerrestaurant mit authentischer srilankischer und internationaler Küche',
    'Our Partner Restaurant': 'Unser Partnerrestaurant',
    'Experience Authentic Flavors at Mila': 'Authentische Aromen im Mila',
    'As a guest of LÁ MANGÁ, enjoy exclusive dining experiences at our partner restaurant,':
        'Als Gast von LÁ MANGÁ genießen Sie besondere kulinarische Erlebnisse in unserem Partnerrestaurant',
    '. Located in the heart of Mirissa, Mila offers a delightful blend of traditional Sri Lankan dishes and international favorites, prepared with fresh, locally-sourced ingredients.':
        '. Mitten in Mirissa gelegen, verbindet das Mila traditionelle srilankische Gerichte mit internationalen Klassikern — zubereitet aus frischen Zutaten aus der Region.',
    'Fresh Seafood Daily': 'Täglich frischer Fisch',
    'Vegetarian Options': 'Vegetarische Gerichte',
    'Tropical Cocktails': 'Tropische Cocktails',
    'Beachside Ambiance': 'Ambiente am Strand',
    'Visit Mila Restaurant': 'Zum Mila Restaurant',
    'Fine Dining in Mirissa': 'Feine Küche in Mirissa',

    # Location
    'Getting Here': 'Anfahrt',
    'Location & Surroundings': 'Lage & Umgebung',
    'Beaches & Nature': 'Strände & Natur',
    'Mirissa Beach: 500 m (7-min walk)': 'Mirissa Beach: 500 m (7 Min. zu Fuß)',
    'Coconut Tree Hill: 5 min away': 'Coconut Tree Hill: 5 Min. entfernt',
    'Thalaramba Beach: 1.8 km': 'Thalaramba Beach: 1,8 km',
    'Weligama Beach: 3.2 km': 'Weligama Beach: 3,2 km',
    'Nearby Dining': 'Essen in der Nähe',
    '- Our Partner Restaurant!': '— unser Partnerrestaurant!',
    'Dewmini Roti Shop: 150 m': 'Dewmini Roti Shop: 150 m',
    'Coco Gate: 120 m': 'Coco Gate: 120 m',
    'Ambrosia Roti Shop: 150 m': 'Ambrosia Roti Shop: 150 m',
    'Transport & Travel': 'Verkehr & Anreise',
    'Mirissa Train Station: 2.4 km': 'Bahnhof Mirissa: 2,4 km',
    'Koggala Airport: 21 km': 'Flughafen Koggala: 21 km',
    'Galle Fort: 34 km (UNESCO Site)': 'Galle Fort: 34 km (UNESCO-Welterbe)',
    'Hotel Location': 'Lage des Hotels',
    'Route from Galle Road': 'Route ab Galle Road',
    'Coordinates copied': 'Koordinaten kopiert',
    'Get Directions': 'Route planen',
    'Open in Waze': 'In Waze öffnen',
    'Copy GPS': 'GPS kopieren',
    'Galle Rd junction': 'Kreuzung Galle Road',
    'Navigate This Route': 'Diese Route navigieren',
    'Walking Route': 'Fußweg',
    'Ask Us': 'Fragen Sie uns',
    'How to find us from the main road': 'So finden Sie uns von der Hauptstraße',
    '520 m in total — about a 1-minute drive or a 7-minute walk from the junction.':
        'Insgesamt 520 m — etwa 1 Minute mit dem Auto oder 7 Minuten zu Fuß ab der Kreuzung.',
    'On the': 'Auf der',
    'Galle&ndash;Matara main road (A2)': 'Hauptstraße Galle&ndash;Matara (A2)',
    ', find the': ' finden Sie die',
    'Udupila Road junction': 'Kreuzung Udupila Road',
    'in Mirissa, just east of the town centre.': 'in Mirissa, kurz östlich des Ortszentrums.',
    'Turn': 'Biegen Sie',
    'inland (north)': 'landeinwärts (Norden)',
    'Udupila Road': 'in die Udupila Road',
    ', away from the beach side.': ' ab, weg von der Strandseite.',
    'Continue about': 'Folgen Sie ihr etwa',
    'up Udupila Road, passing': 'die Udupila Road hinauf, vorbei am',
    'Coco Gate': 'Coco Gate',
    'Dewmini Roti Shop': 'Dewmini Roti Shop',
    'Withanagoda Road': 'in die Withanagoda Road',
    '(shown as Jayalathgama Road on some maps) and carry on about':
        '(auf manchen Karten als Jayalathgama Road) und fahren Sie noch etwa',
    'Madina Watta': 'Madina Watta',
    'is on your right — look for the property sign. Free parking is on site.':
        'liegt auf der rechten Seite — achten Sie auf das Schild. Kostenlose Parkplätze sind vorhanden.',
    'Arriving by tuk-tuk or taxi? Show the driver':
        'Sie kommen mit Tuk-Tuk oder Taxi? Zeigen Sie dem Fahrer',
    'or send us a WhatsApp message and we will guide your driver in.':
        'oder schreiben Sie uns per WhatsApp — wir lotsen Ihren Fahrer hin.',

    # Enquiry
    'Check Availability': 'Verfügbarkeit prüfen',
    'Request Your Dates': 'Ihre Reisedaten anfragen',
    'Send us your dates and we will confirm availability and our best direct rate — usually within a few hours.':
        'Senden Sie uns Ihre Daten — wir bestätigen Verfügbarkeit und unseren besten Direktpreis, meist innerhalb weniger Stunden.',
    'Check-in': 'Anreise',
    'Check-out': 'Abreise',
    'Guests': 'Gäste',
    'Room': 'Zimmer',
    'No preference': 'Keine Präferenz',
    'Sunset — Triple, Garden View': 'Sunset — Dreibett, Gartenblick',
    'Olive — Deluxe Double, Private Entrance': 'Olive — Deluxe-Doppel, eigener Eingang',
    'Garden — Deluxe Double': 'Garden — Deluxe-Doppel',
    'Sea — Deluxe Double': 'Sea — Deluxe-Doppel',
    'Whole property': 'Gesamtes Haus',
    'Your name': 'Ihr Name',
    'Anything we should know?': 'Sollen wir etwas wissen?',
    '(optional)': '(optional)',
    'Send on WhatsApp': 'Per WhatsApp senden',
    'Send by Email': 'Per E-Mail senden',
    'No account, no deposit. Your details go straight to us — nothing is stored on this website.':
        'Kein Konto, keine Anzahlung. Ihre Angaben gehen direkt an uns — auf dieser Website wird nichts gespeichert.',
    'Booking direct means': 'Direkt buchen heißt',
    'Our best rate': 'Unser bester Preis',
    '— no agency commission added on top': '— ohne Portal-Provision obendrauf',
    'Free changes': 'Kostenlose Änderungen',
    'A real person': 'Ein echter Ansprechpartner',
    'on WhatsApp before and during your stay': 'per WhatsApp vor und während Ihres Aufenthalts',
    'Transfers and tours': 'Transfers und Touren',
    'arranged at local prices': 'zu lokalen Preisen organisiert',
    'up to 48 hours before arrival': 'bis 48 Stunden vor Anreise',
    'Prefer to talk?': 'Lieber persönlich?',
    '1 guest': '1 Gast',
    '2 guests': '2 Gäste',
    '3 guests': '3 Gäste',
    '4 guests': '4 Gäste',
    '5 guests': '5 Gäste',
    '6 or more': '6 oder mehr',

    # FAQ
    'Good to Know': 'Gut zu wissen',
    'Frequently Asked Questions': 'Häufige Fragen',
    'Everything guests usually ask before booking': 'Was Gäste vor der Buchung meistens fragen',
    'How far is LÁ MANGÁ from Mirissa Beach?': 'Wie weit ist LÁ MANGÁ vom Mirissa Beach entfernt?',
    'LÁ MANGÁ is about 500 m from Mirissa Beach — roughly a 7-minute walk. Coconut Tree Hill is around 5 minutes away, and the whale-watching harbour is a short tuk-tuk ride.':
        'LÁ MANGÁ liegt rund 500 m vom Mirissa Beach entfernt — etwa 7 Minuten zu Fuß. Der Coconut Tree Hill ist rund 5 Minuten entfernt, und zum Hafen für die Walbeobachtung ist es eine kurze Tuk-Tuk-Fahrt.',
    'What are the check-in and check-out times?': 'Wann sind Check-in und Check-out?',
    'Check-in is from 2:00 PM and check-out is until 11:00 AM. Early check-in or late check-out can often be arranged — just message us on WhatsApp before you arrive.':
        'Check-in ab 14:00 Uhr, Check-out bis 11:00 Uhr. Frühere Anreise oder spätere Abreise lassen sich meist einrichten — schreiben Sie uns einfach vorab per WhatsApp.',
    'Do you arrange whale watching, surfing or airport transfers?':
        'Organisieren Sie Walbeobachtung, Surfkurse oder Flughafentransfers?',
    'Yes. We arrange whale-watching boat tours, surf lessons, safari day trips and private airport transfers from Colombo (CMB) or Mattala (HRI). Message us on WhatsApp and we will book it for you at local rates.':
        'Ja. Wir organisieren Bootstouren zur Walbeobachtung, Surfstunden, Safari-Tagesausflüge und private Flughafentransfers ab Colombo (CMB) oder Mattala (HRI). Schreiben Sie uns per WhatsApp — wir buchen zu lokalen Preisen für Sie.',
    'Is breakfast available?': 'Gibt es Frühstück?',
    'Yes, freshly prepared Sri Lankan and Western breakfast can be arranged on request. Guests also have access to a fully equipped kitchen, and our partner Mila Restaurant is nearby for lunch and dinner.':
        'Ja, auf Wunsch bereiten wir ein frisches srilankisches oder westliches Frühstück zu. Gäste können außerdem die voll ausgestattete Küche nutzen; für Mittag- und Abendessen ist unser Partnerrestaurant Mila ganz in der Nähe.',
    'Is it cheaper to book direct?': 'Ist die Direktbuchung günstiger?',
    'Yes. Booking directly with us on WhatsApp avoids online travel agency commission, so we can offer our best available rate, flexible cancellation up to 48 hours before arrival and personal concierge support during your stay.':
        'Ja. Bei der Direktbuchung über WhatsApp entfällt die Portal-Provision. Deshalb können wir unseren besten verfügbaren Preis anbieten, dazu kostenlose Stornierung bis 48 Stunden vor Anreise und persönliche Betreuung während Ihres Aufenthalts.',
    'Do you have free parking and Wi-Fi?': 'Gibt es kostenlose Parkplätze und WLAN?',
    'Both are free for all guests. We have private on-site parking and high-speed Wi-Fi throughout the property.':
        'Beides ist für alle Gäste kostenlos. Wir haben private Stellplätze direkt am Haus und schnelles WLAN auf dem gesamten Gelände.',
    'What languages do you speak?': 'Welche Sprachen sprechen Sie?',
    'Our team speaks English, German and Sinhala, so international guests can be looked after comfortably.':
        'Unser Team spricht Deutsch, Englisch und Singhalesisch — internationale Gäste sind bei uns bestens aufgehoben.',
    'How do I get to the property from the main road?': 'Wie komme ich von der Hauptstraße zum Haus?',
    'From the Galle–Matara main road (A2), turn inland at the Udupila Road junction, continue about 300 m past Coco Gate and Dewmini Roti Shop, then follow Withanagoda Road into Madina Watta. The route map is in the Location section above.':
        'Von der Hauptstraße Galle–Matara (A2) biegen Sie an der Kreuzung Udupila Road landeinwärts ab, folgen ihr rund 300 m vorbei am Coco Gate und am Dewmini Roti Shop und fahren dann über die Withanagoda Road nach Madina Watta. Die Routenkarte finden Sie oben im Abschnitt Anfahrt.',

    # Contact
    'Get in Touch': 'Kontakt aufnehmen',
    'Contact Us': 'Kontakt',
    'Ready to book your stay? Contact us directly for the best rates.':
        'Bereit für Ihren Aufenthalt? Kontaktieren Sie uns direkt für die besten Preise.',
    'Contact Person': 'Ansprechpartner',
    'WhatsApp / Mobile': 'WhatsApp / Mobil',
    'Address': 'Adresse',
    'Withanagoda Road, Madina Watta,': 'Withanagoda Road, Madina Watta,',
    'Udupila, Mirissa, Sri Lanka': 'Udupila, Mirissa, Sri Lanka',

    # Direct booking
    'Why Book Direct?': 'Warum direkt buchen?',
    'Skip the middleman and enjoy exclusive perks when you book directly with us via WhatsApp.':
        'Ohne Zwischenhändler — bei der Direktbuchung über WhatsApp profitieren Sie von exklusiven Vorteilen.',
    'Best Rate Guaranteed': 'Bestpreis garantiert',
    'Lower prices than any OTA': 'Günstiger als auf jedem Buchungsportal',
    'Flexible Cancellation': 'Flexible Stornierung',
    'Free changes up to 48hrs before': 'Kostenlose Änderungen bis 48 Std. vorher',
    'Personal Concierge': 'Persönlicher Concierge',
    'WhatsApp support before & during stay': 'WhatsApp-Betreuung vor und während des Aufenthalts',

    # Sticky bar / footer / modal
    'Your Serene Getaway in Mirissa': 'Ihr ruhiger Rückzugsort in Mirissa',
    'All Rights Reserved.': 'Alle Rechte vorbehalten.',
    'Choose your preferred booking method': 'Wählen Sie Ihren bevorzugten Buchungsweg',
    'Book on Booking.com': 'Auf Booking.com buchen',
    'Secure online booking with instant confirmation': 'Sichere Online-Buchung mit sofortiger Bestätigung',
    'Request Specific Dates': 'Konkrete Daten anfragen',
    'Send your dates and get a confirmed quote back': 'Daten senden und verbindliches Angebot erhalten',
    'WhatsApp Business': 'WhatsApp Business',
    'Chat directly & get personalized assistance': 'Direkt chatten und persönlich beraten werden',
    'Direct booking via WhatsApp may offer better rates':
        'Direktbuchung über WhatsApp ist oft günstiger',
}

# Attribute values (alt / title / placeholder / aria-label / meta content).
ATTR_T = {
    'Toggle navigation menu': 'Navigationsmenü umschalten',
    'Chat on WhatsApp': 'Auf WhatsApp schreiben',
    'Close': 'Schließen',
    'Previous review': 'Vorherige Bewertung',
    'Next review': 'Nächste Bewertung',
    'Pause review slideshow': 'Bewertungs-Slideshow pausieren',
    'Guest reviews from Google': 'Gästebewertungen von Google',
    'Map views': 'Kartenansichten',
    'e.g. Anna Weber': 'z. B. Anna Weber',
    'Airport transfer, whale watching, early check-in…':
        'Flughafentransfer, Walbeobachtung, frühe Anreise …',
    'Map showing LÁ MANGÁ, Withanagoda Road, Udupila, Mirissa':
        'Karte mit LÁ MANGÁ, Withanagoda Road, Udupila, Mirissa',
    'Map of the 520 metre route from the Galle Road and Udupila Road junction to LÁ MANGÁ':
        'Karte der 520 m langen Route von der Kreuzung Galle Road / Udupila Road zu LÁ MANGÁ',
    'Driving route from the Galle Road and Udupila Road junction to LÁ MANGÁ':
        'Fahrtroute von der Kreuzung Galle Road / Udupila Road zu LÁ MANGÁ',
}

META = {
    'title': 'LÁ MANGÁ | Boutique-Hotel in Mirissa, Sri Lanka | Direkt buchen',
    'description': 'LÁ MANGÁ — Boutique-Hotel in Mirissa, Sri Lanka. 5 Minuten zum Mirissa Beach und zum Coconut Tree Hill. Walbeobachtung, Surfen und Traumstrände. Deutschsprachige Gastgeber, direkt buchen zum Bestpreis.',
    'keywords': 'Hotel Mirissa, Unterkunft Mirissa, Mirissa Sri Lanka, Coconut Tree Hill Hotel, Walbeobachtung Mirissa, Strandhotel Mirissa, Boutique Hotel Sri Lanka, Sri Lanka Südküste Unterkunft, deutschsprachiges Hotel Sri Lanka',
    'og_title': 'LÁ MANGÁ | Boutique-Hotel in Mirissa, Sri Lanka',
    'og_description': 'Komfortable Unterkunft im LÁ MANGÁ. Nur 5 Minuten zum Mirissa Beach, zum Coconut Tree Hill und zu den Walbeobachtungstouren. Deutsch- und englischsprachige Gastgeber.',
}

# WhatsApp deep links carry a prefilled English message; swap them for German.
WA_MESSAGES = [
    ("Hi!%20I%27d%20like%20to%20enquire%20about%20booking%20a%20room%20at%20L%C3%81%20MANG%C3%81.%20Could%20you%20share%20availability%20and%20rates%3F",
     "Hallo!%20Ich%20interessiere%20mich%20f%C3%BCr%20ein%20Zimmer%20im%20L%C3%81%20MANG%C3%81.%20K%C3%B6nnten%20Sie%20mir%20Verf%C3%BCgbarkeit%20und%20Preise%20mitteilen%3F"),
    ("Hi!%20I%27m%20on%20my%20way%20to%20L%C3%81%20MANG%C3%81%20and%20need%20help%20finding%20the%20property.",
     "Hallo!%20Ich%20bin%20auf%20dem%20Weg%20zum%20L%C3%81%20MANG%C3%81%20und%20finde%20das%20Haus%20nicht.%20K%C3%B6nnen%20Sie%20mir%20helfen%3F"),
]
for room, kind_en, kind_de in [
    ('Sunset', 'Triple%20Room%20with%20Garden%20View', 'Dreibettzimmer%20mit%20Gartenblick'),
    ('Olive', 'Deluxe%20Double%20with%20Private%20Entrance', 'Deluxe-Doppelzimmer%20mit%20eigenem%20Eingang'),
    ('Garden', 'Deluxe%20Double%20with%20Garden%20View', 'Deluxe-Doppelzimmer%20mit%20Gartenblick'),
    ('Sea', 'Deluxe%20Double%20Room', 'Deluxe-Doppelzimmer'),
]:
    WA_MESSAGES.append((
        "Hi!%20I%27d%20like%20to%20book%20the%20*{r}%20Room*%20({k}).%20Could%20you%20confirm%20availability%20and%20pricing%3F".format(r=room, k=kind_en),
        "Hallo!%20Ich%20m%C3%B6chte%20das%20Zimmer%20*{r}*%20({k})%20buchen.%20K%C3%B6nnen%20Sie%20Verf%C3%BCgbarkeit%20und%20Preis%20best%C3%A4tigen%3F".format(r=room, k=kind_de),
    ))

# ---------------------------------------------------------------- build

def build():
    s = io.open(SRC, encoding='utf-8').read()

    # Root-absolute asset paths so the same files resolve from /de/.
    s = re.sub(r'(src|href|srcset)="public/', lambda m: '%s="/public/' % m.group(1), s)
    s = s.replace('srcset="/public/images', 'srcset="/public/images')
    s = re.sub(r'(\s)(public/images/[^"\s]+\.webp)(\s+\d+w)', r'\1/\2\3', s)

    s = s.replace('<html lang="en">', '<html lang="de">')

    # Meta / SEO
    s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % META['title'], s, count=1, flags=re.S)
    s = s.replace(
        'content="LÁ MANGÁ - Premium boutique hotel in Mirissa, Sri Lanka. 5 minutes to Mirissa Beach &amp; Coconut Tree Hill. Whale watching, surfing &amp; pristine beaches. Book direct for best rates!"',
        'content="%s"' % META['description'])
    s = re.sub(r'(<meta name="description" content=")[^"]*(")',
               lambda m: m.group(1) + META['description'] + m.group(2), s, count=1)
    s = re.sub(r'(<meta name="keywords" content=")[^"]*(")',
               lambda m: m.group(1) + META['keywords'] + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
               lambda m: m.group(1) + META['og_title'] + m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")',
               lambda m: m.group(1) + META['og_title'] + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
               lambda m: m.group(1) + META['og_description'] + m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")',
               lambda m: m.group(1) + META['og_description'] + m.group(2), s, count=1)
    s = s.replace('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="de_DE">')
    s = s.replace('<link rel="canonical" href="https://lamangamirissa.com/">',
                  '<link rel="canonical" href="https://lamangamirissa.com/de/">')
    s = s.replace('<meta property="og:url" content="https://lamangamirissa.com/">',
                  '<meta property="og:url" content="https://lamangamirissa.com/de/">')
    s = s.replace('<meta name="twitter:url" content="https://lamangamirissa.com/">',
                  '<meta name="twitter:url" content="https://lamangamirissa.com/de/">')

    # WhatsApp prefilled messages
    for en, de in WA_MESSAGES:
        s = s.replace(en, de)

    # Attributes
    for en, de in sorted(ATTR_T.items(), key=lambda kv: -len(kv[0])):
        for attr in ('alt', 'title', 'placeholder', 'aria-label'):
            s = s.replace('%s="%s"' % (attr, en), '%s="%s"' % (attr, de))

    # Visible text nodes, longest first so short keys never break long phrases.
    ordered = sorted(T.items(), key=lambda kv: -len(kv[0]))

    def translate_text(m):
        raw = m.group(1)
        stripped = raw.strip()
        for en, de in ordered:
            if stripped == en:
                return '>' + raw.replace(en, de) + '<'
        return m.group(0)

    s = re.sub(r'>([^<>]+)<', translate_text, s)

    # Footer copyright keeps its year, only the sentence changes.
    s = s.replace('All Rights Reserved.', T['All Rights Reserved.'])

    # Rebuild the FAQ schema from the German questions and answers.
    s = rebuild_faq_schema(s)

    # hreflang pair + a language switcher in the nav.
    s = add_hreflang(s, current='de')
    s = add_lang_switch(s, to_en=True)

    return s


def rebuild_faq_schema(s):
    m = re.search(r'<!-- FAQ Schema -->\s*<script type="application/ld\+json">(.*?)</script>', s, re.S)
    if not m:
        return s
    data = json.loads(m.group(1))
    for item in data.get('mainEntity', []):
        item['name'] = T.get(item['name'], item['name'])
        ans = item['acceptedAnswer']
        ans['text'] = T.get(ans['text'], ans['text'])
    block = ('<!-- FAQ Schema -->\n    <script type="application/ld+json">\n'
             + json.dumps(data, ensure_ascii=False, indent=4) + '\n    </script>')
    return s[:m.start()] + block + s[m.end():]


def add_hreflang(s, current):
    links = (
        '\n    <!-- Language alternates -->\n'
        '    <link rel="alternate" hreflang="en" href="https://lamangamirissa.com/">\n'
        '    <link rel="alternate" hreflang="de" href="https://lamangamirissa.com/de/">\n'
        '    <link rel="alternate" hreflang="x-default" href="https://lamangamirissa.com/">\n'
    )
    if 'hreflang=' in s:
        return s
    return s.replace('    <!-- Open Graph / Facebook -->', links + '\n    <!-- Open Graph / Facebook -->', 1)


def add_lang_switch(s, to_en):
    # Drop any switcher inherited from the source page so a rebuild never
    # stacks a second one next to the first.
    s = re.sub(r'<li class="lang-switch">.*?</li>\s*', '', s, flags=re.S)

    if to_en:
        item = ('<li class="lang-switch"><a href="/" hreflang="en" lang="en">'
                '<i class="fas fa-globe" aria-hidden="true"></i> EN</a></li>')
    else:
        item = ('<li class="lang-switch"><a href="/de/" hreflang="de" lang="de">'
                '<i class="fas fa-globe" aria-hidden="true"></i> DE</a></li>')
    anchor = '<li><a href="https://wa.me/94762096130" class="btn-book">'
    idx = s.index(anchor)
    return s[:idx] + item + '\n                ' + s[idx:]


def report_untranslated(s):
    body = s[s.index('<body>'):]
    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<svg.*?</svg>', '', body, flags=re.S)
    leftovers = []
    for t in re.findall(r'>([^<>]+)<', body):
        t = t.strip()
        if not t or t in leftovers:
            continue
        # Only a miss if the German differs — proper nouns like "Coco Gate"
        # are deliberately identical in both languages.
        if t in T and T[t] != t:
            leftovers.append(t)
    return leftovers


if __name__ == '__main__':
    html = build()
    os.makedirs(OUT_DIR, exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8').write(html)

    missing = report_untranslated(html)
    print('Wrote %s (%d KB)' % (os.path.relpath(OUT, ROOT), len(html.encode('utf-8')) // 1024))
    if missing:
        print('\n%d string(s) still in English:' % len(missing))
        for t in missing:
            print('  -', t)
    else:
        print('All mapped strings translated.')
