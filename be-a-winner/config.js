// Konfiguration. Leer lassen = Demo-Modus (Daten nur auf diesem Gerät, Beispiel-Team).
// Für den echten Betrieb mit dem Team: Werte aus Supabase eintragen (siehe README.md).
window.BAW_CONFIG = {
  supabaseUrl: "",       // z. B. "https://abcd1234.supabase.co"
  supabaseAnonKey: "",   // Publishable/anon key (darf öffentlich sein)
  vapidPublicKey: "",    // öffentlicher VAPID-Schlüssel für Push-Nachrichten
};
