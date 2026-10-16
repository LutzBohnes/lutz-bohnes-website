import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: { default: s.siteName, template: `%s · ${s.siteName}` }, description: s.tagline };
}

function fontHref(...fonts: string[]) {
  const families = [...new Set(fonts)]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const brand = {
    "--brand-primary": s.primaryColor,
    "--brand-accent": s.accentColor,
    "--brand-bg": s.backgroundColor,
    "--brand-text": s.textColor,
    "--brand-heading-font": `"${s.headingFont}"`,
    "--brand-body-font": `"${s.bodyFont}"`,
    "--brand-radius": `${s.borderRadius}px`,
  } as React.CSSProperties;

  return (
    <html lang="de" style={brand}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontHref(s.headingFont, s.bodyFont)} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-slate-500">
            <span>{s.footerText}</span>
            <span className="flex gap-4">
              <Link href="/nutzungsbedingungen" className="hover:underline">Nutzungsbedingungen</Link>
              <Link href="/impressum" className="hover:underline">Impressum</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
