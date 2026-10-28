export function fmtRp(n: number | string | null | undefined): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export function shortRp(n: number): string {
  const v = Number(n || 0);
  if (v >= 1_000_000_000)
    return (v / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";
  if (v >= 1_000_000)
    return (v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " jt";
  if (v >= 1_000) return Math.round(v / 1_000) + " rb";
  return String(v);
}

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Kemarin";
  if (d < 30) return `${d} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function friendlyError(error: unknown): string {
  const msg = String((error as { message?: string } | null)?.message ?? error ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "Email atau password salah.";
  if (msg.includes("email not confirmed")) return "Email belum diverifikasi. Cek kotak masuk Anda.";
  if (msg.includes("already registered")) return "Email sudah terdaftar. Silakan login.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
  if (msg.includes("same password")) return "Password baru tidak boleh sama dengan yang lama.";
  if (msg.includes("password") && msg.includes("characters")) return "Password terlalu pendek.";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  return (error as { message?: string } | null)?.message || "Terjadi kesalahan. Silakan coba lagi.";
}

export function safeImageUrl(u: unknown): string {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^\/images\/demo-cars\/(?:[a-z]+\.svg|demo-car-\d{3}\.jpg)$/.test(s)) return s;
  if (/^data:image\/(jpeg|png|webp|jpg);base64,/i.test(s)) return s;
  if (/^https?:\/\//i.test(s) && s.length <= 4096) return s;
  return "";
}
