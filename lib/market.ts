export function checkoutCalc(price: number, dpPct: number, tenor: number, rate: number) {
  const dp = Math.round((price * dpPct) / 100);
  const principal = Math.max(0, price - dp);
  const total = principal * (1 + (rate / 100) * (tenor / 12));
  const installment = tenor > 0 ? Math.round(total / tenor) : 0;
  return { dp, principal, total: Math.round(total), installment };
}

export const TENORS = [12, 24, 36, 48, 60];

export const PRICE_PRESETS = [
  { id: "all", label: "Semua harga", min: "", max: "" },
  { id: "u200", label: "< Rp 200 jt", min: "", max: 200000000 },
  { id: "200-400", label: "Rp 200–400 jt", min: 200000000, max: 400000000 },
  { id: "400-600", label: "Rp 400–600 jt", min: 400000000, max: 600000000 },
  { id: "a600", label: "> Rp 600 jt", min: 600000000, max: "" },
] as const;

export const HIST_OPTIONS = [
  { id: "all", label: "Semua aktivitas" },
  { id: "beli", label: "Pembelian" },
  { id: "jual", label: "Penjualan" },
  { id: "tawar", label: "Penawaran" },
  { id: "favorit", label: "Favorit" },
  { id: "status", label: "Status" },
  { id: "verifikasi", label: "Verifikasi" },
  { id: "batal", label: "Pembatalan" },
  { id: "hapus", label: "Penghapusan" },
];

export const WIDGETS = [
  { id: "banner", label: "Banner Sapaan", desc: "Sapaan + target" },
  { id: "kpis", label: "Ringkasan (KPI)", desc: "4 kartu angka" },
  { id: "trend", label: "Tren Penjualan", desc: "Grafik garis" },
  { id: "donut", label: "Jenis Mobil", desc: "Grafik lingkaran" },
  { id: "table", label: "Daftar Inventaris", desc: "Tabel mobil" },
  { id: "popular", label: "Mobil Populer", desc: "Top listing" },
  { id: "activity", label: "Aktivitas & Tawaran", desc: "Grafik tawaran" },
  { id: "recent", label: "Aktivitas Terbaru", desc: "Timeline" },
];

export function resolveHistFilterValue(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "all";
  const hit = HIST_OPTIONS.find(
    (o) => o.id === s || o.label.toLocaleLowerCase("id") === s.toLocaleLowerCase("id")
  );
  if (hit) return hit.id;
  return "q:" + s;
}

export function resolveBuyYearValue(raw: unknown): string {
  const digits = String(raw ?? "").replace(/[^\d]/g, "").slice(0, 4);
  if (!digits) return "all";
  const y = Number(digits);
  const maxYear = new Date().getFullYear();
  if (y < 1990 || y > maxYear) return "q:" + digits;
  return String(y);
}
