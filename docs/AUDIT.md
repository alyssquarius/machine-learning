# Audit fungsional AutoBuyCars — 29 Oktober 2026

Perbaikan pada audit ini:
- Chat tidak mengosongkan pesan saat menambah batas pemuatan pesan lama; posisi baca dipertahankan berdasarkan selisih tinggi konten.
- Harga simulasi diinisialisasi ulang ketika harga dari URL berubah.
- Timer filter kota/tahun dibatalkan saat parameter pencarian berubah atau halaman ditutup, sehingga nilai lama tidak menimpa pencarian baru.
- Detail katalog ditutup ketika parameter detail dihapus dari URL.
- Login email dan Google saling menonaktifkan selama proses berjalan; respons OAuth tanpa URL menampilkan kesalahan dan memulihkan tombol.

Verifikasi:
- 43/43 tes otomatis lulus, mencakup guard autentikasi, role, kepemilikan listing, favorit, galeri maksimal 10 foto, seed demo dan pengelompokan kendaraan.
- Build produksi, TypeScript, dan pemeriksaan whitespace diff lulus.
- Browser: login admin berhasil mengarah ke dashboard; profil admin berhasil dimuat dengan badge Administrator. Refresh profil dijalankan, tetapi pembacaan browser berikutnya terputus sehingga hasil setelah refresh belum dapat dikonfirmasi pada audit ini.

Batas cakupan:
- Pengiriman chat dua akun, pemuatan riwayat chat panjang, OAuth Google, email pemulihan, dan unggah file ke Supabase belum diuji ulang end-to-end pada audit ini. Perbaikan chat diperiksa melalui kode dan build.
- Listing, favorit dan riwayat masih berbasis localStorage. Data ini belum tersinkron antarperangkat dan kontrol store di sisi browser bukan pengganti otorisasi database untuk inventaris produksi.
- Tidak mengubah data akun, mengirim pesan, atau menerbitkan listing selama audit. Belum push/deploy.

## Verifikasi langsung pembatasan chat dan fondasi database

SQL `docs/sql/verify-support-chat.sql` dijalankan ulang pada proyek Supabase melalui SQL Editor. Hasil PASS: buyer kirim/baca, admin baca/balas, akun luar tidak dapat membaca atau mengirim, pengirim palsu/pesan terlalu panjang/update pesan ditolak. Seluruh data uji di-rollback. Skrip diperbaiki agar dapat menguji pembeli yang sudah mempunyai thread, tanpa menimpa percakapan yang ada.

Fondasi `supabase/migrations/20261029_marketplace_foundation.sql` menyiapkan katalog terpusat dan favorit privat. Data pembelian, alamat, dan penawaran tidak ditempatkan pada tabel katalog publik. Skema dan query katalog sebagai anon berhasil divalidasi dalam transaksi rollback pada database yang sama. **Migrasi ini belum diterapkan permanen dan frontend belum menggunakan tabel baru.** Integrasi store, impor data lokal yang ditinjau, penanganan konflik antarperangkat, serta migrasi riwayat/transaksi masih diperlukan; sinkronisasi antarperangkat belum selesai.
