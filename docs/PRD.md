# PRD AutoBuyCars — Pembaruan stabilitas dan autentikasi

Versi dokumen: 1.2 · Tanggal: 28 Oktober 2026 · Bahasa produk: Indonesia.
Status: implementasi kode lokal; rilis Vercel dan migrasi Supabase belum diterapkan.

## 1. Ringkasan produk

AutoBuyCars membantu pengunjung menelusuri mobil, pembeli menyimpan favorit dan membuat penawaran, serta dealer mengelola listing dan melihat aktivitas penjualan. Supabase menyediakan autentikasi dan profil/peran; fitur marketplace masih menyimpan data pada browser.

Pembaruan ini berfokus pada akses halaman, kestabilan build, sesi login, pemulihan akun, dan konsistensi peran. Produk saat ini merupakan prototipe fungsional, belum marketplace transaksi produksi dengan data terpusat.

## 2. Masalah dan bukti

| Masalah | Bukti | Dampak |
| --- | --- | --- |
| Link gagal di Safari biasa | Pesan “alamat halaman tidak sah”; URL yang sama terbuka di Safari Private dan browser terpisah | Pengguna lama tidak dapat masuk melalui profil browser tersebut |
| Sesi berpotensi membesar | Riwayat kode menyimpan avatar base64 dalam metadata Auth; JWT membawa metadata | Risiko cookie/header terlalu besar; hubungan langsung dengan error Safari belum dibuktikan melalui trace |
| Build bergantung jaringan font | Build awal gagal mengambil Google Fonts | Build dapat gagal ketika layanan font tidak terjangkau |
| Konfigurasi akun kosong memicu exception | Client dibuat pada efek provider tanpa penanganan konfigurasi | Halaman dapat crash pada deployment yang belum dikonfigurasi |
| Redirect autentikasi terlalu luas | Halaman reset dan verifikasi diperlakukan seperti login/register | Pemulihan akun terhalang saat sesi sudah terbentuk |
| Role tidak konsisten | Callback melakukan upsert role default; email/cache memberi fallback admin | Peran lama tertimpa dan akses UI tidak mengikuti database |
| Katalog kosong di profil browser baru | Store menggunakan localStorage | Pengguna mengira listing hilang atau backend bermasalah |

## 3. Tujuan dan ukuran keberhasilan

1. Build production selesai tanpa mengambil font dari layanan eksternal.
2. Katalog publik tetap terbuka tanpa sesi login dan saat konfigurasi akun tidak tersedia.
3. Semua skenario regresi autentikasi otomatis lulus.
4. Buyer, dealer, dan admin mengikuti role database; email/cache tidak memberikan akses admin.
5. Reset password dapat diakses ketika sesi recovery aktif.
6. Pengguna memahami bahwa data marketplace saat ini tersimpan pada browser.
7. Sebelum rilis dinyatakan selesai: smoke test pada deployment baru lulus di Safari biasa dan Private, termasuk login, OAuth, dan recovery dengan akun uji.

Nomor 1–6 ditangani dalam pembaruan kode, dengan pengujian yang disebutkan pada bagian 10. Nomor 7 membutuhkan deployment dan pengujian integrasi nyata.

## 4. Pengguna dan hak akses

| Peran | Kebutuhan utama | Akses |
| --- | --- | --- |
| Pengunjung | Melihat katalog dan detail sebelum mendaftar | Katalog, filter, detail, navigasi login/daftar |
| Buyer | Menyimpan pilihan dan menghubungi penjual | Katalog, favorit, penawaran/checkout simulasi, riwayat, profil/pengaturan |
| Dealer | Menambah dan mengelola mobil | Fitur buyer serta jual mobil dan dashboard |
| Admin | Mengawasi listing dan konfigurasi | Fitur pengelolaan sesuai permission UI; role diberikan pengelola melalui database |

Route sensitif diperiksa di server. Pembatasan UI tidak menggantikan RLS database. Penyimpanan marketplace lokal dapat diubah oleh pengguna browser dan tidak cocok sebagai sumber kebenaran transaksi produksi.

## 5. Ruang lingkup pembaruan

| ID | Persyaratan | Hasil yang diharapkan |
| --- | --- | --- |
| FR-01 | Halaman awal mengarah ke katalog | `/` → `/beli`; pengunjung tidak dipaksa login |
| FR-02 | Build memakai font sistem | Tidak ada fetch Google Fonts saat build |
| FR-03 | Konfigurasi Supabase divalidasi | URL/key kosong atau URL tidak valid tidak menyebabkan katalog crash; halaman akun menampilkan informasi layanan |
| FR-04 | Cookie refresh bertahan pada redirect | Header cookie yang diperbarui tetap dikirim ke browser |
| FR-05 | Jalur pemulihan tetap dapat diakses | `/forgot-password`, `/reset-password`, `/verify-email` tidak dialihkan akibat sesi aktif |
| FR-06 | Penanganan OAuth jelas | Role existing dipertahankan; user baru mendapat buyer; kode gagal kembali ke login dengan pesan |
| FR-07 | Peran mengikuti database | Tidak ada admin otomatis berdasarkan email atau cache role browser |
| FR-08 | Role switching jujur terhadap hasil server | Buyer/dealer hanya berganti jika write database berhasil; switch ke admin ditolak client |
| FR-09 | Objek user tidak disalin ke cookie sesi | Semua client SSR memakai tokens-only; avatar base64 tetap dilarang dalam metadata Auth |
| FR-10 | Katalog memberi konteks data lokal | Informasi penyimpanan browser terlihat; keadaan katalog kosong dibedakan dari filter tanpa hasil |
| FR-11 | Pemulihan error terjangkau pengunjung | Tautan error kembali ke katalog publik |
| FR-13 | Informasi manfaat sesuai fitur | Halaman login tidak mengklaim jumlah unit, inspeksi, atau garansi yang belum didukung data |
| FR-12 | Perlindungan privilege database disiapkan | Migrasi menolak perubahan admin/verified dari client; penerapan masih menjadi langkah rilis |

## 6. Fitur yang dipertahankan

- Katalog dan filter kategori, kota, tahun, rentang harga, serta urutan.
- Detail mobil, favorit, penawaran, simulasi tunai/kredit, invoice lokal, dan riwayat.
- Dashboard, listing, status listing, dan pengaturan tampilan.
- Tema terang/gelap, sidebar responsif, profil dan avatar, serta tautan WhatsApp.

Angka dashboard dan status transaksi mengikuti data browser, bukan laporan pembayaran atau transaksi terverifikasi. Kontak WhatsApp memerlukan nomor operasional yang benar; nomor bawaan proyek belum diverifikasi.

## 7. Alur utama

1. **Pengunjung:** buka URL → katalog → filter/detail → login jika membutuhkan fitur akun.
2. **Email/password:** login → Supabase memverifikasi → role database menentukan katalog atau dashboard.
3. **Google:** provider → callback → tukar kode sesi → baca profil; buat buyer hanya jika profil belum ada → tujuan sesuai role.
4. **Pemulihan:** masukkan email → email recovery → reset password, termasuk pertukaran kode PKCE bila diberikan → simpan password → katalog.
5. **Konfigurasi kosong:** katalog tetap tersedia; halaman akun menjelaskan layanan belum tersedia dan menyediakan tautan katalog.
6. **Safari sesi lama bermasalah:** gunakan Private untuk akses sementara; diagnosis/pemulihan cookie dilakukan tanpa menghapus listing lokal secara sembarangan.

## 8. Kebutuhan nonfungsional

- Desktop dan mobile: form, navigasi, dan katalog dapat digunakan tanpa konten terpotong; kontrol filter kategori/urutan memiliki nama aksesibel.
- Keamanan: tidak ada service role key di browser; admin berasal dari database, data sensitif tidak dimasukkan ke metadata Auth, RLS aktif.
- Ketahanan: gangguan Auth tidak menghentikan akses katalog publik; exception form diubah menjadi pesan yang terbaca.
- Operasional: env Production/Preview diatur sebelum build; perubahan public env memerlukan deployment baru.
- Kompatibilitas: Next.js 16 memakai konvensi proxy dari dokumentasi paket yang terpasang; pengujian lokal memakai Node 22.13+.
- Integritas data: sebelum pembersihan data browser, data lokal harus dicadangkan; tidak ada penghapusan data Safari dalam pembaruan ini.

## 9. Di luar cakupan rilis ini dan backlog

| Prioritas | Kebutuhan berikutnya | Kriteria siap |
| --- | --- | --- |
| P0 sebelum marketplace produksi | Pindahkan mobil, favorit, penawaran, dan transaksi ke tabel Supabase dengan RLS per pemilik | Listing dealer terlihat buyer di browser/perangkat berbeda; akses lintas pemilik ditolak |
| P0 sebelum marketplace produksi | Otorisasi mutasi di server/database dan audit admin | Aksi langsung melalui API tidak dapat melewati izin |
| P0 sebelum marketplace produksi | Validasi transaksional status pembelian | Dua pembeli tidak dapat membeli unit yang sama; perubahan status atomik dan tercatat |
| P1 | Avatar dan foto listing memakai Storage URL | Tidak ada base64 besar pada Auth atau baris profil; batas format/ukuran dan policy storage diuji |
| P1 | Backup dan migrasi localStorage | Ekspor/impor dengan validasi dan pemulihan sebelum beralih database |
| P1 | Observabilitas dan pemulihan sesi Safari | Log kesalahan tanpa token/PII; prosedur pemulihan cookie diuji pada akun terdampak |
| P1 | Uji E2E akun staging | Login, daftar, OTP/email link, Google, recovery, role switching, upload avatar lulus |
| P2 | Pembayaran nyata, inspeksi kendaraan dan verifikasi dealer | Provider, proses bisnis, audit, dan penanggung jawab ditentukan sebelum mengklaim transaksi/inspeksi terverifikasi |
| P2 | Integrasi prediksi harga/ML | Dataset, izin penggunaan, metrik, dan validasi model disepakati; belum diimplementasikan meskipun nama repository machine-learning |

## 10. Kriteria penerimaan dan validasi

| Area | Kriteria | Validasi |
| --- | --- | --- |
| Build | Production build selesai | `npm run build` |
| Tipe | Tidak ada error TypeScript | `npm run typecheck` |
| Auth regression | Guest, role, recovery, cookie redirect, callback invalid, env kosong dan outage sesuai spesifikasi | `npm test`: 19 skenario, termasuk SDK Supabase SSR dengan transport Auth tiruan |
| Production saat diagnosis | URL terbuka pada sesi baru | Diuji langsung di Safari Private dan browser terpisah; deployment lama |
| UI lokal | Katalog dan login dapat ditampilkan | Katalog dan login diuji di browser; tanpa env, katalog tetap terbuka dan pesan layanan akun tampil. Bukan bukti integrasi login Supabase |
| Migrasi privilege | Client tidak dapat menaikkan role/admin atau verifikasi | Harus diuji staging dan diterapkan pengelola; belum dilakukan |
| Rilis baru | Safari biasa/Private dan autentikasi nyata berhasil | Menunggu deployment versi baru dan akun uji |

Pengujian otomatis memakai mock untuk perilaku routing; tidak membuktikan koneksi database, konfigurasi email, provider Google, RLS produksi, atau pemulihan cookie Safari lama.

## 11. Rencana rilis dan ketergantungan

1. Review kode, jalankan typecheck/test/build, dan periksa UI lokal.
2. Uji migrasi profil pada staging, kemudian terapkan melalui akses database tepercaya.
3. Pastikan env Vercel, redirect allowlist Supabase, provider OAuth, dan template email benar.
4. Deploy perubahan melalui repository ke Vercel; pastikan alias produksi menunjuk versi baru.
5. Jalankan smoke test Safari dan akun staging sebelum mengumumkan rilis selesai.
6. Jika perlu rollback frontend, pilih deployment Vercel sebelumnya. Trigger database dinilai terpisah; rollback frontend tidak otomatis membatalkan migrasi database.

Ketergantungan yang belum diverifikasi: konfigurasi Auth/email/OAuth produksi, schema/RLS aktual, domain/nomor WhatsApp operasional, dan akun uji untuk validasi end-to-end.

## 12. Tindak lanjut error Profil Saya di Safari Private

Screenshot lanjutan memperlihatkan `/profil` gagal juga pada Safari Private setelah aktivitas akun. Keberhasilan katalog sebagai guest tidak membuktikan sesi terautentikasi sehat.

Pemeriksaan kode SDK yang terpasang menemukan `updateUser()` hanya menyimpan objek user dan mempertahankan access token lama. Cleanup avatar sebelumnya belum memanggil `refreshSession()`, sehingga JWT lama masih dapat memuat base64 walaupun metadata pengguna sudah bersih. Ini celah yang direproduksi pada pengujian SDK; hubungan langsung terhadap request Safari pengguna tetap membutuhkan pengujian sesi nyata.

Pembaruan tambahan: cleanup terpusat memeriksa metadata user dan JWT lama, memperbarui metadata hanya bila diperlukan, kemudian menunggu JWT baru sebelum navigasi. Error cleanup tidak diabaikan. Cookie penghapusan chunk lama dipertahankan meskipun ada beberapa pembaruan cookie dalam satu request. Pembacaan profil/avatar tidak lagi menulis metadata Auth. Halaman profil memakai user dari provider, memuat data saat akun berubah, menangani storage yang diblokir, dan menampilkan pesan bila foto gagal dimuat.

Kriteria tambahan: sesi uji berisi avatar inline menghasilkan cookie yang lebih kecil dan tanpa chunk usang; metadata user bersih tetapi JWT lama masih besar tetap direfresh; sesi sehat tidak menyebabkan update atau refresh tambahan; callback bersamaan berbagi satu proses perbaikan. Pengujian profil dengan akun nyata pada deployment baru masih diperlukan.
