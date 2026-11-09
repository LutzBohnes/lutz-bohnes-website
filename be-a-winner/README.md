# Be a Winner

Team-App fürs Handy: Jeden Tag drei Wins, bewiesen per Foto, mit Rangliste und Push-Nachrichten an alle.

## Regeln

- **Montag** legt jede:r das **Wochenziel** und alle Wins der Woche **mit Uhrzeit** fest:
  - 2 **Morgen-Wins** vor der Arbeit (z. B. 20 Liegestütze, 10 Min lesen)
  - 1 **Abend-Win** = 1/5 vom Wochenziel (fünf Abende, ein Ziel)
- Wer mitten in der Woche startet, plant ab jetzt. Liegt eine Uhrzeit heute schon hinter einem, startet man mit dem nächsten Win (z. B. heute Abend mit dem 1/5).
- Ein Win zählt **nur mit Live-Foto** aus der Kamera und nur am geplanten Tag. Bis 15 Min nach der Uhrzeit gilt er als **pünktlich**, danach als **zu spät** (zählt trotzdem).
- Alle sehen alle: Feed mit Fotos, Team-Fortschritt, Wochenplan jedes Mitglieds, Reaktionen 🔥💪👏🏆.
- **Rangliste** (Woche und Gesamt): meiste Wins vorn, bei Gleichstand entscheidet die Zahl pünktlicher Wins.
- **Push**: Holt jemand einen Win, bekommen alle anderen eine Nachricht. Dazu 15 Min vor jedem eigenen Win eine Erinnerung.

Die Regeln werden in der Datenbank erzwungen (eigener Win, richtiger Tag, Pünktlichkeit vom Server berechnet), nicht nur in der App.

## Ausprobieren (Demo)

Ohne Konfiguration startet die App im Demo-Modus mit einem Beispiel-Team. Lokal:

```bash
cd be-a-winner
python3 -m http.server 8000   # dann http://localhost:8000 öffnen
```

`node build-demo.mjs` erzeugt zusätzlich `../demo/be-a-winner-demo.html` (eine Datei, nur Demo).

## Für das Team einrichten

Technik: statische PWA (HTML/JS, kein Build) + Supabase (Login, Datenbank, Foto-Speicher, Live-Updates, Edge Function für Push).

1. **Supabase-Projekt** anlegen, im SQL-Editor `supabase/migrations/001_be_a_winner.sql` ausführen.
2. **VAPID-Schlüssel** erzeugen: `npx web-push generate-vapid-keys`
3. **Edge Function** deployen und Secrets setzen:
   ```bash
   supabase functions deploy push --no-verify-jwt
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:du@firma.de CRON_SECRET=$(openssl rand -hex 24)
   ```
4. **Erinnerungen** (optional): in `supabase/002_reminder_cron.sql` Projekt-Ref und CRON_SECRET eintragen, im SQL-Editor ausführen.
5. **`config.js`** ausfüllen: Projekt-URL, Publishable/anon Key, öffentlicher VAPID-Schlüssel.
6. **Hosten** über HTTPS (Pflicht für Kamera und Push), z. B. GitHub Pages, Netlify oder Vercel: einfach den Ordner `be-a-winner` veröffentlichen.
7. Link ans Team schicken. Jede:r öffnet ihn im Handy-Browser und legt die App auf den Home-Bildschirm
   (iPhone: Safari → Teilen → „Zum Home-Bildschirm“; Android: Menü → „App installieren“), dann im Profil Push aktivieren.
8. Sobald alle registriert sind: in Supabase unter *Authentication → Sign In / Providers* neue Registrierungen abschalten, damit nur euer Team drin ist. E-Mail-Bestätigung kann man dort ebenfalls an- oder ausschalten.

### Hinweise

- **iPhone-Push** funktioniert ab iOS 16.4 und nur, wenn die App vom Home-Bildschirm gestartet wird.
- Fotos liegen in einem privaten Bucket, sichtbar nur für angemeldete Team-Mitglieder (signierte Links, 1 h gültig).
- Zeiten gelten in Europe/Berlin.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html`, `styles.css`, `app.js` | App (Demo- und Live-Modus) |
| `config.js` | Supabase- und Push-Konfiguration |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installierbare App, Push-Empfang |
| `supabase/migrations/001_be_a_winner.sql` | Tabellen, Regeln, Rechte, Foto-Speicher |
| `supabase/functions/push/index.ts` | Push an das Team, Erinnerungen |
| `supabase/002_reminder_cron.sql` | Zeitplan für Erinnerungen |
