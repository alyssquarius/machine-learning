# Perapian kode, 29 Oktober 2026

AntiSlop dipakai dalam mode `during` untuk kebersihan kode dan komentar. Tampilan, teks produk, rute, aturan akses, skema database, dan alur transaksi tidak didesain ulang.

## File yang dihapus

| File | Dasar penghapusan |
| --- | --- |
| `components/interactive-ripple.tsx` | Tidak terjangkau dari import halaman, layout, proxy, maupun tes; tidak ada pemanggilan komponen. |
| `public/favicon.svg` | Tidak direferensikan. Metadata memakai `favicon.ico` dan `favicon.png`, yang tetap tersedia. |
| `.DS_Store` | Metadata Finder lokal yang sudah diabaikan Git. |

Foto katalog dan logo merek dipanggil melalui path dinamis. SVG kategori lama tetap diperlukan untuk kompatibilitas data browser. Manifest sumber dan lisensi gambar, migrasi SQL, panduan operasional, tes, konfigurasi, serta lockfile tetap dipertahankan.

## Perubahan kode

- Membersihkan import, tipe, variabel lokal, dan destructuring parameter yang tidak digunakan; kontrak props tetap kompatibel dengan pemanggil.
- Menghapus komentar dekoratif, label JSX, narasi langkah yang sudah terlihat dari kode, dan komentar konfigurasi gambar yang keliru. Komentar keamanan, autentikasi, batas browser, dan kompatibilitas data dipertahankan.
- Menyeragamkan format sumber aplikasi, CSS, tes, dan konfigurasi menggunakan Prettier 3.9.10 sebagai dev dependency.
- Menambahkan `npm run format`, `npm run format:check`, serta pemeriksaan `noUnusedLocals` dan `noUnusedParameters`.
- Membuat fixture tes store menerima kedua gaya tanda kutip pada import `./format`, sehingga pemformatan tidak mematahkan pemuatan fixture.

## Delivery gate untuk lingkup perapian

- PASS: `npm run format:check`, seluruh file yang dicakup mengikuti konfigurasi formatter.
- PASS: `npm run typecheck`, termasuk penolakan import, variabel lokal, dan parameter yang tidak digunakan.
- PASS: `npm test`, 43 tes lulus: proteksi rute, OAuth, sesi/cookie, hak akses, mutasi store, foto demo, dan pencarian kendaraan.
- PASS: `npm run build`, build produksi berhasil dan 19 halaman statis dibuat.
- PASS: `git diff --check`, tidak ada kesalahan whitespace.
- PASS: uji browser pada build produksi: katalog berisi 50 mobil; pencarian Avanza menyisakan satu mobil; dialog detail menampilkan Toyota Avanza dan dapat ditutup dengan Escape; simulator menghitung Rp 3.021.667/bulan untuk harga Rp 185.000.000, DP 30%, bunga flat 8%, dan tenor 60 bulan. Log browser tidak mencatat error atau warning selama rangkaian ini.

Gate visual AntiSlop tidak diterapkan sebagai desain baru karena pekerjaan ini mempertahankan desain yang ada. Uji browser di atas merupakan smoke test, bukan pengujian semua kontrol. Login baru, pengiriman chat, unggahan, pembayaran, dan perubahan database tidak diuji langsung; tes otomatis memakai fixture dan mock untuk perilaku terkait.
