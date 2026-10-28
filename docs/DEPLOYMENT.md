# Deployment dan diagnosis akses Safari

Tanggal pemeriksaan: 28 Oktober 2026 (Asia/Jakarta).

## Hasil pemeriksaan langsung

- URL produksi: https://machine-learning-lemon.vercel.app.
- Dashboard Vercel proyek `matjirou/machine-learning` menunjukkan **Ready**, sumber `main`, commit `4f31d91`.
- Safari biasa menampilkan: “Safari tidak dapat membuka halaman … karena alamat halaman tidak sah.”
- URL yang sama berhasil dibuka di **Safari Private** dan browser terpisah; keduanya sampai ke `/beli`.
- Karena sesi baru berhasil, masalah mengarah ke data/sesi situs pada profil Safari biasa. Penyebab HTTP/2 atau ukuran header belum dibuktikan dengan network trace. Kode dan commit sebelumnya menunjukkan riwayat metadata avatar base64 yang dapat membesarkan cookie.
- Build lokal sebelum pembaruan gagal mengambil `Plus Jakarta Sans` dari `fonts.googleapis.com`. Ini kegagalan yang direproduksi di lingkungan lokal, bukan bukti bahwa build produksi Vercel sebelumnya gagal.

## Akses sementara tanpa menghapus data

Buka URL melalui Safari → File → New Private Window. Cara ini sudah diuji berhasil.

Menghapus seluruh data situs Safari dapat menghilangkan listing, favorit, dan riwayat yang hanya tersimpan pada browser tersebut. Jangan langsung menghapus seluruh data situs. Cadangkan data terlebih dahulu; pemulihan sesi sebaiknya hanya menghapus cookie autentikasi situs terkait. Jika request telah ditolak sebelum sampai ke aplikasi, kode cleanup setelah login tidak bisa membersihkan cookie lama itu.

## Perubahan kode yang disiapkan

1. Font sistem menggantikan pengambilan Google Fonts saat build.
2. Konvensi `middleware.ts` dimigrasikan menjadi `proxy.ts` sesuai dokumentasi Next.js yang terpasang.
3. Konfigurasi Supabase divalidasi; katalog tidak crash jika konfigurasi kosong/tidak valid.
4. Cookie sesi yang diperbarui/disingkirkan tetap diteruskan ketika melakukan redirect.
5. Reset password, forgot password, dan verifikasi email tidak lagi dialihkan hanya karena ada sesi login.
6. Callback OAuth mempertahankan role profil yang sudah ada; kode tidak valid diarahkan ke login dengan pesan yang dapat ditindaklanjuti.
7. Browser dan server menggunakan `cookies.encode: "tokens-only"`, sehingga objek user lengkap tidak ikut disalin ke cookie. JWT tetap mengandung metadata: larangan avatar base64 dalam metadata Auth tetap berlaku.
8. Pengecekan awal browser memakai `getUser()`; query role dari event Auth ditunda hingga callback selesai untuk menghindari konflik auth lock.
9. Kredensial admin demo di UI, pemberian admin berdasarkan email, dan fallback izin dari cache browser dihapus.
10. Akses halaman dashboard/jual memeriksa role database di server. Perubahan role yang ditolak database tidak dianggap berhasil di UI.

Perubahan ini tidak otomatis mengganti deployment yang telah aktif.

## Konfigurasi Vercel

1. Repository: `alyssquarius/machine-learning`, framework Next.js, root direktori proyek ini.
2. Install: `npm ci`; build: `npm run build`; output directory gunakan default Next.js, bukan `out`.
3. Gunakan versi Node yang didukung paket (22.13+, misalnya Node 24).
4. Pada Environment Variables isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` untuk Production; isi juga untuk Preview bila digunakan. Jangan menyalin service role key.
5. Jalankan build/deployment baru setelah perubahan kode atau variabel public. Periksa build log dan status Ready.
6. Periksa Domains: alias produksi harus menunjuk deployment baru. Uji Visit dari profil biasa dan Private.

## Konfigurasi Supabase Auth

- Site URL produksi: `https://machine-learning-lemon.vercel.app`.
- Redirect URLs yang digunakan aplikasi:
  - `https://machine-learning-lemon.vercel.app/auth/callback`
  - `https://machine-learning-lemon.vercel.app/reset-password`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
- Untuk Preview, tambahkan origin preview yang benar secara terbatas bila diperlukan.
- Jika memakai Google OAuth, pastikan provider aktif dan callback Google menggunakan endpoint Auth dari proyek Supabase yang benar.
- Halaman verifikasi aplikasi menerima OTP enam digit. Template email Supabase harus menyediakan token yang sesuai; tautan konfirmasi juga diarahkan ke `/auth/callback`.
- Pastikan tabel `profiles`, kebijakan own-profile RLS, dan storage avatar sudah disiapkan.

## Migrasi perlindungan profil

File: `supabase/migrations/20261028_protect_profile_privileges.sql`.

Migrasi menambahkan trigger untuk menolak pemberian role admin oleh user biasa, perubahan role admin yang sudah ada oleh client, serta perubahan status verifikasi oleh client. Admin tetap ditetapkan melalui SQL Editor/service role oleh pengelola. Pergantian buyer/dealer tetap diperbolehkan sesuai fitur saat ini.

Migrasi belum diterapkan atau diuji terhadap database pengguna. Uji staging: buyer/dealer dapat memperbarui profilnya sendiri; client tidak bisa menulis `role=admin` atau mengubah `verified`; user lain tidak bisa memperbarui profil tersebut; pengelola tetap dapat menetapkan admin melalui jalur tepercaya. Kebijakan RLS lain yang sudah ada juga perlu ditinjau.

## Pemeriksaan setelah deployment

- `/` mengarah ke `/beli`; katalog dan aset lokal terbuka.
- Guest yang membuka dashboard/jual/favorit/riwayat/profil/pengaturan diarahkan ke login.
- Login email dan Google: buyer ke katalog, dealer/admin ke dashboard; role lama tidak berubah.
- Forgot password → email → reset password tidak terhalang redirect.
- Callback kedaluwarsa menunjukkan error login, bukan halaman crash.
- Upload avatar dan login ulang tidak menambah base64 pada metadata Auth.
- Lakukan pengujian di Safari biasa dan Private. Jika hanya profil lama bermasalah, lakukan pemulihan cookie dengan menjaga data localStorage.
- Jangan menganggap katalog kosong pada browser baru sebagai kehilangan data server: penyimpanan listing masih lokal.

## Hasil validasi kode lokal

- `npm run typecheck`: lulus.
- `npm test`: 19 skenario lulus, termasuk SDK SSR nyata dengan transport Auth tiruan.
- `npm run build`: lulus, termasuk build dengan kedua env Supabase kosong.
- Browser lokal: katalog dan form login tersedia dengan konfigurasi; tanpa konfigurasi, katalog tetap terbuka dan halaman akun menampilkan informasi layanan.
- `git diff --check`: tidak ada whitespace error.
- Belum diuji: login/Google/recovery nyata, database staging, migrasi SQL, serta deployment versi baru.

## Temuan lanjutan: Profil Saya gagal pada Safari Private

Screenshot lanjutan menunjukkan error `/profil` juga terjadi pada sesi Private. Penjelasan awal bahwa masalah hanya pada profil Safari biasa belum cukup. Request HTTP tanpa login ke `/profil` mengembalikan 307 ke `/login`, sehingga URL tersebut sendiri valid.

SDK Auth yang terpasang mempertahankan JWT lama setelah `updateUser()`. Karena itu, mengubah `avatar_url` menjadi null saja belum menghapus base64 dari access token yang sudah terbit. Helper `lib/supabase/session-hygiene.ts` kini menunggu refresh token setelah cleanup, termasuk saat metadata user sudah bersih tetapi JWT masih berisi avatar lama. Pengujian dengan SDK SSR nyata dan transport tiruan membuktikan cookie terfragmentasi berubah menjadi satu cookie kecil setelah perbaikan.

Halaman profil juga tidak lagi melakukan request Auth dan penulisan metadata berulang ketika snapshot store berubah. Cookie deletion dari pembaruan bertahap tetap dikirim agar chunk lama tidak tertinggal.

Perubahan tambahan ini belum dideploy. Setelah deployment, uji login dan Profil Saya pada sesi baru. Jangan menghapus seluruh data situs tanpa backup; jika browser sudah menolak request karena cookie lama, cleanup dalam aplikasi mungkin tidak sempat dijalankan. Belum ada pengambilan network trace dari sesi Safari yang gagal.

## Penyelesaian terverifikasi dengan akun admin

Audit akun nyata berikutnya mengonfirmasi bahwa metadata Auth masih berisi avatar sepanjang 53.807 karakter dan role profil NULL. Memperbaiki cookie guest saja belum menyelesaikan sumber token besar. Metadata diperbaiki melalui SQL Editor dengan mempertahankan foto pada profiles, lalu role admin ditetapkan setelah persetujuan khusus pemilik. JWT baru sekitar 860 byte (sebelumnya 72.600) dan satu cookie (sebelumnya 31). Request HTTP/2 ke /profil berhasil 200. Safari biasa berhasil login ke dashboard, membuka Profil Saya, dan refresh penuh dengan foto tetap tampil.

Trigger protect_profile_privileges dan guard_auth_inline_avatar sudah dibuat pada Supabase produksi. Sesi lama Safari diakhiri melalui tombol Keluar dari katalog yang dipulihkan lewat riwayat tab; tidak dilakukan penghapusan data domain yang kini memiliki localStorage.

Perbaikan frontend tambahan dan 32 pengujian role/store ada pada kode lokal dan perlu deployment baru. Lihat [AUDIT.md](AUDIT.md) dan PRD versi 1.3. Pengujian perilaku trigger dengan subtransaksi sudah lulus setelah Mac dibuka: perubahan role admin oleh client, perubahan verified, serta penulisan avatar inline pada Auth semuanya ditolak. Pemeriksaan sesudah pengujian memastikan role tetap admin, verified tetap false, metadata tetap 73 byte, dan foto tetap 53.807 karakter pada profiles.
