# Neighbours.com

Marktplatz für Nachbarschaftshilfe: Frauen bieten ihre Dienstleistungen in ihrer Umgebung an
(Einkaufshilfe, Haushalt, Kinderbetreuung, Nachhilfe, Tierbetreuung, Beauty, Grußvideos …).
Bezahlt wird mit **Credits**, an denen die Plattform über eine Gebühr mitverdient.

## Funktionen

- **Suche & Filter** nach Stichwort, Ort bzw. PLZ (Präfix, z. B. `50` = Raum Köln), Kategorie und Art (Dienstleistung / Grußvideo)
- **Credits**: Pakete kaufen per Stripe Checkout (ohne Stripe-Key: Demo-Modus mit direkter Gutschrift)
- **Buchungen & Grußvideos**: Credits werden treuhänderisch gehalten und erst bei Erledigung an die Anbieterin gutgeschrieben; Stornierung = volle Rückerstattung
- **Bezahlter Chat**: Kund:innen zahlen pro Nachricht den Chat-Preis der Anbieterin, Antworten sind kostenlos
- **Einnahmen**: Plattformgebühr (Standard 20 %) auf Buchungen, Grußvideos und Chat-Nachrichten; Anbieterinnen beantragen Auszahlungen per IBAN
- **Sicherheit**: Anbieterinnen müssen verifiziert sein (18+, Identität), bevor ihre Anzeigen sichtbar sind; Wortfilter gegen erotische Angebote in Anzeigen, Profilen und Chats; Meldefunktion; Sperren von Konten
- **Admin-Bereich** (`/admin`):
  - **Design & Texte**: Name, Slogan, Logo, Startseiten-Texte, Footer, Schriften (Google Fonts), Farben, Eckenradius – mit Live-Vorschau
  - Plattformgebühr, Kategorien, Verifizierungen, Meldungen, Auszahlungen, Nutzer:innen, Umsatzübersicht

## Tech-Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma · Stripe

## Lokal starten

```bash
cp .env.example .env            # DATABASE_URL anpassen
npm install
npx prisma db push              # Tabellen anlegen
npm run db:seed                 # Kategorien anlegen
SEED_DEMO=1 npm run db:seed     # optional: Demo-Konten + Anzeigen (Passwort: demo1234)
npm run dev
```

Das **erste registrierte Konto wird automatisch Admin**. Demo-Logins:
`admin@neighbours.test`, `anna@neighbours.test`, `lena@neighbours.test`, `kunde@neighbours.test`.

### Stripe

`STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` setzen und den Webhook
`/api/stripe/webhook` für das Event `checkout.session.completed` einrichten
(lokal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`).

## Vor dem Livegang

- Nutzungsbedingungen, Datenschutzerklärung und Impressum rechtlich prüfen lassen
- Identitätsprüfung professionalisieren (z. B. IDnow, Veriff) statt manueller Prüfung
- Auszahlungen an Anbieterinnen über einen Zahlungsdienst mit KYC abwickeln (z. B. Stripe Connect) – das Halten fremder Gelder kann sonst eine Erlaubnis nach ZAG erfordern
- Bilder-Upload (aktuell Bild-URL), E-Mail-Benachrichtigungen und Passwort-Zurücksetzen ergänzen
