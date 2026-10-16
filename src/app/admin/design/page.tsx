import { resetSettings } from "@/app/actions/admin";
import { PageHeader, Panel } from "@/components/dashboard";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "../settings-form";

export default async function AdminDesign() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Design & Texte" subtitle="Name, Texte, Schriften, Farben und Gebühr. Änderungen gelten sofort für die ganze Seite." />
      <Panel>
        <SettingsForm settings={settings} />
        <form action={resetSettings} className="mt-6 border-t border-slate-200 pt-4">
          <button className="text-sm text-red-600 hover:underline">Alle Design-Einstellungen auf Standard zurücksetzen</button>
        </form>
      </Panel>
    </>
  );
}
