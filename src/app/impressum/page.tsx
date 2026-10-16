export const metadata = { title: "Impressum" };

export default function ImprintPage() {
  return (
    <article className="card mx-auto max-w-3xl space-y-2">
      <h1 className="text-2xl font-bold">Impressum</h1>
      <p className="text-slate-500">Angaben gemäß § 5 DDG – bitte vor dem Livegang ausfüllen.</p>
      <p>Firmenname<br />Straße Nr.<br />PLZ Ort<br />E-Mail: kontakt@example.com</p>
    </article>
  );
}
