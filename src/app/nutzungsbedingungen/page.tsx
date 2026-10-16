import { getSettings } from "@/lib/settings";

export const metadata = { title: "Nutzungsbedingungen" };

export default async function TermsPage() {
  const { siteName, platformFeePercent } = await getSettings();
  return (
    <article className="card mx-auto max-w-3xl space-y-4 leading-relaxed">
      <h1 className="text-2xl font-bold">Nutzungsbedingungen</h1>
      <p className="text-sm text-amber-700">
        Vorlage – vor dem Livegang bitte rechtlich prüfen lassen (AGB, Datenschutz, Widerrufsrecht).
      </p>
      <h2 className="text-lg font-semibold">1. Zweck</h2>
      <p>
        {siteName} ist ein Marktplatz für Nachbarschaftshilfe und alltägliche Dienstleistungen wie Einkaufshilfe,
        Haushalt, Kinderbetreuung, Nachhilfe, Tierbetreuung, Beauty oder persönliche Grußvideos.
      </p>
      <h2 className="text-lg font-semibold">2. Verbotene Inhalte</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Erotische, sexuelle oder anzügliche Angebote jeder Art, einschließlich „Begleitung“ oder „Dates“ gegen Bezahlung.</li>
        <li>Angebote im Namen Dritter oder unter Zwang. Jede Anbieterin bietet ausschließlich ihre eigene Leistung an.</li>
        <li>Illegale Leistungen, Diskriminierung, Belästigung sowie das Teilen fremder persönlicher Daten.</li>
      </ul>
      <p>Verstöße führen zur sofortigen Sperrung des Kontos. Verdachtsfälle von Ausbeutung melden wir den Behörden.</p>
      <h2 className="text-lg font-semibold">3. Anbieterinnen</h2>
      <p>
        Anbieterinnen müssen mindestens 18 Jahre alt sein und sich verifizieren lassen, bevor ihre Anzeigen
        sichtbar werden. Sie sind für die Versteuerung ihrer Einnahmen selbst verantwortlich.
      </p>
      <h2 className="text-lg font-semibold">4. Credits und Gebühren</h2>
      <p>
        Credits werden im Voraus gekauft. Bei Buchungen werden Credits treuhänderisch verwahrt und nach Erledigung
        an die Anbieterin gutgeschrieben. {siteName} behält eine Servicegebühr von {platformFeePercent} % ein.
        Chat-Nachrichten an Anbieterinnen kosten den im Profil angegebenen Preis.
      </p>
    </article>
  );
}
