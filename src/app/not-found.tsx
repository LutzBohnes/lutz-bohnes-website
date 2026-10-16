import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
      <Link href="/" className="btn mt-4">Zur Startseite</Link>
    </div>
  );
}
