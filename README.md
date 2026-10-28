# AutoBuyCars

Platform jual beli mobil berbahasa Indonesia menggunakan Next.js 16 App Router, React, Tailwind CSS v4, dan Supabase Auth.

## Menjalankan proyek

Gunakan Node.js 22.13+ (Node.js 24 LTS dapat digunakan).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Isi `.env.local` dengan URL proyek Supabase dan **public anon key**. Jangan gunakan service role key di variabel `NEXT_PUBLIC_*`. Buka `http://localhost:3000`; halaman awal mengarah ke `/beli`.

Tanpa konfigurasi Supabase, katalog tetap dapat dibuka sebagai pengunjung dan halaman akun menampilkan informasi bahwa layanan belum tersedia.

## Validasi

```bash
npm run typecheck
npm test
npm run build
npm start
```

Build menggunakan webpack. Font memakai font sistem sehingga proses build tidak membutuhkan koneksi ke Google Fonts. Pengujian autentikasi menggunakan Node test runner dengan mock Supabase; tidak membutuhkan kredensial nyata.

## Fitur dan batasan

- Workspace responsif dengan tema terang/gelap, panduan fitur, dan kondisi kosong yang memberikan arahan.
- Simulator kredit `/simulasi` dengan DP, tenor, bunga flat, unduhan ringkasan, dan pencarian sesuai anggaran.
- Katalog, pencarian/filter, detail kendaraan, favorit, dashboard, listing, penawaran, simulasi checkout/invoice, riwayat, tema, profil, dan kontak WhatsApp.
- Login email/password, pendaftaran/verifikasi email, Google OAuth, dan reset password memakai Supabase.
- **Listing, penawaran, transaksi, favorit, dan riwayat masih menggunakan localStorage. Data belum dibagikan antarbrowser/perangkat. Checkout bukan pembayaran sungguhan.**
- Profil/peran memakai tabel Supabase `profiles`. Admin ditetapkan melalui database oleh pengelola; alamat email tertentu tidak memberi akses admin otomatis. Cache browser tidak menjadi sumber izin admin.
- Foto tidak boleh disimpan sebagai base64 dalam metadata Auth karena metadata masuk ke JWT/cookie. Penyimpanan avatar lama pada profil masih perlu dipindahkan ke Storage sebagai pengembangan berikutnya.

## Deployment Vercel

Lihat [panduan deployment dan diagnosis Safari](docs/DEPLOYMENT.md). Konfigurasi lokal `.env.local` tidak otomatis masuk ke Vercel. Perubahan `NEXT_PUBLIC_*` memerlukan build/deployment baru.

Untuk database baru, baca `supabase-setup-avatars.sql`, kemudian migrasi `supabase/migrations/20261028_protect_profile_privileges.sql`. Tinjau dan uji pada staging sebelum produksi. Migrasi privilege profil dan penjagaan avatar Auth sudah diterapkan pada proyek Supabase saat audit ini. Lihat docs/AUDIT.md untuk rincian hasil langsung dan batas pengujian.

## Dokumen produk

[Laporan audit sesi, role, dan fungsi](docs/AUDIT.md) mencatat perbaikan Supabase yang sudah diterapkan dan batas pengujian.

[PRD AutoBuyCars setelah pembaruan](docs/PRD.md) menjelaskan perilaku saat ini, perbaikan, kriteria penerimaan, dan pengembangan menuju marketplace dengan data terpusat.

## Struktur

- `app/`: halaman App Router dan callback autentikasi.
- `components/`: komponen UI, penyimpanan browser, dan provider autentikasi/peran.
- `lib/supabase/`: konfigurasi dan client Supabase browser/server serta pembaruan sesi.
- `proxy.ts`: pemeriksaan sesi dan redirect Next.js 16.
- `supabase/migrations/`: migrasi database yang ditinjau terpisah dari deployment frontend.
- `tests/`: regresi konfigurasi, proteksi rute, cookie redirect, dan OAuth.
- `docs/`: PRD dan panduan operasional.
