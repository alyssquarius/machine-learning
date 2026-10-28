# Audit akses, sesi, dan fungsi AutoBuyCars

Tanggal: 28 Oktober 2026 (Asia/Jakarta).

## Hasil utama yang sudah diverifikasi

Akun yang ditunjuk pemilik berhasil login melalui Safari biasa pada domain produksi. Setelah perbaikan Supabase, menu menampilkan Administrator, login menuju dashboard, dan Profil Saya berhasil dibuka serta direfresh penuh. Foto profil tetap tampil.

Penyebab yang direproduksi sebelum perbaikan:

- `auth.users.raw_user_meta_data.avatar_url` berisi data gambar inline sepanjang 53.807 karakter.
- Metadata Auth berukuran 53.878 byte; JWT login sekitar 72.600 byte dan menghasilkan 31 cookie dengan total nilai sekitar 96.987 byte.
- Request menggunakan token tersebut gagal dengan HTTP/2 frame error; halaman guest tanpa token sebelumnya bisa terbuka.
- Baris `profiles` akun tersebut memiliki role `NULL`, sehingga UI memilih fallback buyer.
- Membersihkan cookie saja hanya memulihkan guest; login berikutnya membuat token besar lagi selama metadata sumber belum diperbaiki.

Perbaikan database yang sudah dilakukan:

1. Mempertahankan foto pada `profiles.avatar_url`, kemudian mengubah duplikat `avatar_url` pada metadata Auth menjadi null.
2. Menetapkan role admin untuk akun yang ditunjuk setelah persetujuan khusus pemilik. Status `verified` tidak ikut diubah.
3. Menambahkan trigger `protect_profile_privileges` agar client tidak dapat menetapkan/mengubah role admin atau status verifikasi sendiri.
4. Menambahkan trigger `guard_auth_inline_avatar` agar penulisan avatar `data:` ke metadata Auth ditolak.

Sesudah perbaikan, metadata Auth menjadi 73 byte, JWT login sekitar 860 byte, dan sesi menggunakan satu cookie. Request `/profil` melalui HTTP/2 mengembalikan status 200. Sesi lama di Safari biasa berhasil diakhiri melalui tombol Keluar dari halaman katalog yang dipulihkan melalui riwayat tab; localStorage tidak dihapus.

## Matriks role dan batas nyata

| Fungsi | Guest | Buyer | Dealer | Admin |
| --- | --- | --- | --- | --- |
| Katalog dan detail | Ya | Ya | Ya | Ya |
| Kontak WhatsApp | Ya | Ya | Ya | Ya |
| Favorit dan riwayat akun | Login dahulu | Milik akun | Milik akun | Milik akun |
| Membuat penawaran / checkout simulasi | Tidak | Ya | Ya | Ya |
| Membuat listing | Tidak | Tidak | Ya | Ya |
| Edit/hapus/status/duplikat listing | Tidak | Tidak | Hanya milik sendiri | Seluruh listing lokal |
| Menerima/menolak penawaran | Tidak | Tidak | Hanya listing sendiri | Seluruh listing lokal |
| Dashboard dan statistik inventaris | Tidak | Tidak | Inventaris sendiri | Seluruh inventaris lokal |
| Profil dan preferensi akun | Login dahulu | Milik akun | Milik akun | Milik akun |
| Mengubah role menjadi admin | Tidak | Tidak | Tidak | Melalui pengelola database, bukan client |
| Mengubah status verified | Tidak | Tidak | Tidak | Memerlukan jalur pengelolaan tepercaya; belum ada UI verifikasi |
| Kelola user, ban user, pesan internal | Belum tersedia | Belum tersedia | Belum tersedia | Belum ada halaman/API, meskipun nama permission sudah dideklarasikan |

Buyer/dealer saat ini merupakan pilihan mode akun mandiri. Role dealer **tidak membuktikan verifikasi identitas**. Penetapan admin berasal dari database, bukan alamat email atau cache browser.

## Koreksi tambahan pada kode lokal

- Pemeriksaan kepemilikan kini dilakukan pada operasi store untuk edit, update, hapus, status, duplikat dan keputusan penawaran; nama penjual tidak dapat memalsukan `sellerId` pada pembuatan listing.
- Buyer/guest tidak dapat membuat listing lewat store, dan guest tidak dapat membuat penawaran atau pembelian simulasi.
- Inventaris/dashboard dealer dibatasi ke listing sendiri; admin dapat melihat seluruh inventaris lokal.
- Penawaran yang dibuat akun lain pada browser yang sama dimuat kembali dari katalog bersama; penyimpanan preferensi tidak memakai snapshot mobil yang sudah usang.
- Penghitungan favorit buyer tidak memakai filter inventaris penjual; notifikasi penjualan hanya ditambahkan ke riwayat pemilik listing.
- Snapshot ref diperbarui langsung agar mutasi berurutan tidak kehilangan perubahan sebelum React merender ulang.
- Mobil dengan purchase/invoice tidak dapat dibuka kembali sebagai unit belum terjual hanya dengan perubahan status.
- Query role yang sudah usang tidak boleh memulihkan izin lama setelah sesi berubah/keluar.
- Profil mendapat judul halaman yang benar, fallback nama dari akun, pembacaan nama database, dan penyimpanan nama ke `profiles` sebelum menampilkan sukses.
- Label pembeli/dealer tidak lagi menyatakan verified tanpa pemeriksaan atribut tersebut.

Perubahan kode lokal ini belum dipush/deploy pada saat audit. Perbaikan data dan trigger Supabase sudah diterapkan langsung.

## Validasi

- 32 pengujian otomatis: routing/autentikasi, cookie sesi, matriks role, dan operasi store nyata dengan hook scaffolding serta localStorage memori.
- Pengujian mencakup penolakan edit/hapus/status/duplikat lintas pemilik, penolakan keputusan tawaran dealer lain, penawaran buyer sampai ke pemilik, dan checkout simulasi tanpa transaksi keuangan nyata.
- TypeScript dan production build diperiksa.
- Database langsung: tiga pemeriksaan subtransaksi lulus untuk larangan perubahan role admin, perubahan verified, dan avatar inline pada Auth. Pemeriksaan akhir memastikan tidak ada perubahan uji tersimpan; script ada pada `docs/sql/verify-session-guards.sql`.
- Integrasi langsung: login admin Supabase; pembacaan role; HTTP/2 `/profil`; Safari login → dashboard → Profil Saya → refresh penuh.
- Pengujian layout browser untuk buyer/dealer dengan akun terpisah, Google OAuth, email recovery, pembayaran nyata, dan sinkronisasi perangkat berbeda belum dilakukan.

## Batas yang belum selesai

Data listing, favorit, tawaran, invoice dan riwayat masih localStorage. Pembatasan store memperbaiki perilaku aplikasi, tetapi bukan otorisasi backend dan tidak mencegah pemilik browser mengubah data lokal. Konflik penulisan serentak antar-tab tidak menyediakan transaksi database. Sebelum dipakai sebagai marketplace produksi, data dan otorisasi mutasinya harus dipindahkan ke backend dengan RLS, audit trail dan transaksi atomik.

Admin belum mempunyai halaman/API pengelolaan pengguna atau verifikasi dealer. Checkout hanya simulasi dan tidak memproses pembayaran. Nomor WhatsApp operasional, konfigurasi Google/email, serta alur verifikasi bisnis perlu divalidasi tersendiri.


## Pembaruan UI dan fitur — 28 Oktober 2026

Desain workspace diperbarui pada dashboard, katalog, jual, favorit, riwayat, profil, pengaturan dan halaman autentikasi. Simulator kredit mandiri, unduhan ringkasan TXT dan panduan fitur ditambahkan. Grafik dashboard memakai aktivitas aktual; kondisi tanpa data memberi arahan tanpa angka contoh. Rincian kebutuhan ada pada PRD versi1.4.

Validasi terakhir: TypeScript lulus, 32/32 pengujian regresi lulus, production build selesai. Browser lokal diuji pada1440×1000 dan375×812, mode terang/gelap, profil admin, drawer, filter tambahan, bantuan dan simulator. Lebar dokumen katalog/dashboard mobile375 px sesuai viewport tanpa overflow horizontal. Dialog listing dibuka dan dibatalkan; Escape mengembalikan fokus ke pemicu. Pemeriksaan menemukan tombol kontak menutupi modal; dialog kini dirender melalui portal pada body dan hasilnya diperiksa ulang. Override viewport telah dikembalikan ke ukuran normal.

Preview lokal berjalan pada http://127.0.0.1:3000/dashboard. UI baru belum dipush atau dideploy ke Vercel. Pengujian ini tidak mencakup publikasi listing nyata, pembayaran, perubahan password atau seluruh alur OAuth/email.
