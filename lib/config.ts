/**
 * Konfigurasi aplikasi AutoBuyCars
 */

export const LS_ADMIN_WHATSAPP = "abc_admin_whatsapp";

export const config = {
  whatsapp: {
    // Nomor WhatsApp customer service bawaan (format: 62xxxx tanpa +)
    phoneNumber: "6281234567890",
    defaultMessage: "Halo, saya tertarik dengan AutoBuyCars",
  },
  app: {
    name: "AutoBuyCars",
    description: "Platform jual beli mobil terpercaya",
  },
} as const;

/**
 * Mengambil nomor WhatsApp aktif admin / customer service
 * Prioritas: LocalStorage (hasil setting admin) -> default config
 */
export function getAdminWhatsApp(): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LS_ADMIN_WHATSAPP);
      if (saved && saved.trim().length >= 8) {
        return saved.trim();
      }
    } catch {
      /* abaikan */
    }
  }
  return config.whatsapp.phoneNumber;
}

/**
 * Menyimpan / memperbarui nomor WhatsApp resmi admin
 */
export function setAdminWhatsApp(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  if (!clean.startsWith("62") && clean.length > 0) {
    clean = "62" + clean;
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LS_ADMIN_WHATSAPP, clean);
      window.dispatchEvent(new CustomEvent("whatsapp-updated", { detail: clean }));
    } catch {
      /* abaikan */
    }
  }
  return clean;
}
