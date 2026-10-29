# Pencarian biru langit dan etalase bertahap

Mode AntiSlop: During, pilihan pengguna dalam sesi ini. Referensi: screenshot tiket.com dari pengguna, diterapkan pada fungsi pencarian mobil AutoBuyCars.

Design Read: pencarian mobil untuk pembeli, dengan panel putih di atas latar biru langit, pilihan kebutuhan, kolom pencarian berlabel, dan hasil kendaraan. ENERGY 2 / RHYTHM 2 / MOTION 1.

## Hasil

- Hero dipersingkat agar pencarian menjadi fokus. Foto memakai aset kendaraan yang sudah ada.
- Pilihan kebutuhan tampil di bagian atas panel. Tombol Cari mobil dan Enter mengarahkan fokus ke hasil. Filter merek, model, kota, tahun, kategori, harga, dan pengurutan tetap tersedia.
- Etalase awal menampilkan maksimal 12 mobil. Tombol berikutnya menambah maksimal 12 kartu. Sisa kurang dari 12 ditampilkan sesuai jumlah sebenarnya. Tombol hilang ketika semua hasil sudah ditampilkan.
- Mengubah pencarian atau filter mengembalikan batas ke 12, termasuk saat kembali ke filter sebelumnya. Fokus keyboard dipindahkan ke kartu pertama yang baru dibuka.
- Ponsel memakai kolom bertumpuk, tombol pencarian penuh, dan pilihan kebutuhan yang dapat digeser. Layar di bawah 375px memakai satu kolom untuk pilihan kategori dan urutan.

## Delivery Gate

- Hard Gate: PASS untuk perubahan ini. Browser menunjukkan 12, 24, 36, 48, lalu 50 kartu, tanpa tombol tambahan setelah habis. Filter listrik menunjukkan 7 kartu; kembali ke Semua mobil menunjukkan 12 kartu. Pencarian tanpa hasil menunjukkan keadaan kosong. Lebar dokumen 320px pada viewport 320px dan 390px pada viewport 390px. Tidak ada promo, statistik pemasaran, kontak, atau aset fiktif baru.
- Purpose Gate: PASS. Biru langit mengelompokkan fungsi pencarian; panel putih menonjolkan formulir; biru lebih tua digunakan untuk tombol agar teks putih terbaca. Bayangan ringan hanya memisahkan panel pencarian yang bertumpuk pada hero. Ikon memakai simbol mobil, pencarian, dan kebutuhan yang relevan dari komponen yang sudah ada.
- Liveliness: PASS. Hero singkat, panel pencarian lebih rapat, dan etalase foto memiliki ritme berbeda. Motif mobil serta pilihan kebutuhan mempertahankan identitas otomotif AutoBuyCars. Tidak menyalin merek atau fungsi perjalanan tiket.com.
- Craftsmanship: PASS. TypeScript, build produksi, dan 52 tes lulus. Browser menguji pemuatan hasil, filter, reset batas, hasil kosong, dan tema gelap pada ponsel. Kontras teks putih pada #0073ce adalah 4,83:1; #365c79 pada #ddf1ff adalah 6,11:1. Semua memenuhi WCAG AA untuk teks normal.

Perubahan masih lokal. Alur autentikasi dan penyimpanan akun tidak diubah dalam pekerjaan ini.
