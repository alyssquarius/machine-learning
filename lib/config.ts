/**
 * Konfigurasi aplikasi AutoBuyCars
 */

export const config = {
  whatsapp: {
    // Nomor WhatsApp customer service (format: 62xxxx tanpa +)
    phoneNumber: "6281234567890",
    defaultMessage: "Halo, saya tertarik dengan AutoBuyCars",
  },
  app: {
    name: "AutoBuyCars",
    description: "Platform jual beli mobil terpercaya",
  },
} as const;
