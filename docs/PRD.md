# PRD AutoBuyCars — Workspace otomotif dan pembaruan pengalaman pengguna

Versi dokumen: 1.7 · Tanggal: 28 Oktober 2026 · Bahasa produk: Indonesia.
Status: perbaikan data akun dan trigger Supabase sudah diterapkan; pembaruan tampilan, simulator dan perbaikan role/store/profil tersedia pada kode dan preview lokal, belum dideploy ke Vercel. Lihat AUDIT.md untuk bukti dan batas pengujian.

## 1. Ringkasan produk

AutoBuyCars membantu pengunjung menelusuri mobil, pembeli menyimpan favorit dan membuat penawaran, serta dealer mengelola listing dan melihat aktivitas penjualan. Supabase menyediakan autentikasi dan profil/peran; fitur marketplace masih menyimpan data pada browser.

Pembaruan ini berfokus pada akses halaman, kestabilan build, sesi login, pemulihan akun, dan konsistensi peran. Produk saat ini merupakan prototipe fungsional, belum marketplace transaksi produksi dengan data terpusat.

## 2. Masalah dan bukti

| Masalah | Bukti | Dampak |
| --- | --- | --- |
| Link gagal di Safari biasa | Pesan “alamat halaman tidak sah”; URL yang sama terbuka di Safari Private dan browser terpisah | Pengguna lama tidak dapat masuk melalui profil browser tersebut |
| Sesi berpotensi membesar | Riwayat kode menyimpan avatar base64 dalam metadata Auth; JWT membawa metadata | Risiko cookie/header terlalu besar; audit akun nyata mengonfirmasi token dan cookie terlalu besar; lihat bagian 13 |
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
| Auth regression | Guest, role, recovery, cookie redirect, callback invalid, env kosong dan outage sesuai spesifikasi | `npm test`: 32 skenario, termasuk SDK Supabase SSR dengan transport Auth tiruan |
| Production saat diagnosis | URL terbuka pada sesi baru | Diuji langsung di Safari Private dan browser terpisah; deployment lama |
| UI lokal | Katalog dan login dapat ditampilkan | Katalog dan login diuji di browser; tanpa env, katalog tetap terbuka dan pesan layanan akun tampil. Bukan bukti integrasi login Supabase |
| Migrasi privilege | Client tidak dapat menaikkan role/admin atau verifikasi | Diterapkan di Supabase; tiga percobaan perubahan terlarang ditolak dan di-rollback |
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

## 13. Audit akun admin dan pengujian Safari setelah login

Audit akun nyata mengonfirmasi avatar inline pada metadata Auth sepanjang 53.807 karakter dan role profil NULL. Setelah foto dipertahankan pada profil, metadata Auth dibersihkan dan role ditetapkan admin dengan persetujuan pemilik. JWT turun dari sekitar 72.600 menjadi 860 byte, cookie dari 31 menjadi satu. Login admin, dashboard, Profil Saya dan refresh penuh berhasil pada Safari biasa di domain produksi. Trigger perlindungan privilege dan larangan avatar inline pada metadata Auth telah ditambahkan di Supabase.

Perbaikan kode lanjutan mencakup kepemilikan listing/tawaran di store, inventaris per dealer, sinkronisasi tawaran lokal, pembatasan pembukaan ulang purchase, serta penyimpanan nama profil ke database. Rincian matriks role, bukti, 32 pengujian otomatis, dan fitur admin yang belum tersedia ada pada [laporan audit](AUDIT.md). Perubahan frontend lanjutan perlu deployment baru; penyimpanan marketplace masih lokal.

Pemeriksaan database lanjutan setelah Mac dibuka juga lulus: client tidak dapat mengubah role admin/status verified atau menulis avatar inline pada Auth. Ketiga percobaan diuji di subtransaksi dan tidak menyimpan perubahan. Profil admin kembali direfresh di Safari dan tetap terbuka.


## 14. Pembaruan pengalaman pengguna — versi 1.4

### Arah desain

Workspace memakai sidebar hijau hutan, aksen emerald, latar netral, kartu dengan garis lembut, hierarki tipografi konsisten dan fotografi kendaraan dari aset lokal. Tema terang/gelap mengikuti token warna yang sama. Navigasi desktop berubah menjadi drawer pada lebar di bawah 1024 px. Tidak ada angka pertumbuhan, garansi kendaraan, atau klaim verifikasi yang dibuat tanpa data.

### Persyaratan fitur

| ID | Area | Perilaku dan kriteria penerimaan |
| --- | --- | --- |
| UX-01 | Navigasi | Menu mengikuti role; halaman aktif jelas; pencarian header menuju katalog; pintasan Cmd/Ctrl+K memfokuskan pencarian; drawer dapat dibuka dan ditutup pada ponsel. |
| UX-02 | Dashboard | Ringkasan berasal dari inventaris dan riwayat akun; grafik mempunyai pilihan 7/30/90 hari dan kondisi kosong yang memberi arahan. Tidak memakai tren contoh sebagai aktivitas nyata. |
| UX-03 | Katalog | Hero, pencarian, kategori, urutan, rentang harga, kota dan tahun; filter tambahan dapat dibuka pada ponsel; hasil kosong menawarkan simulator atau penambahan listing sesuai akses. |
| UX-04 | Listing & favorit | Kartu menampilkan spesifikasi/status dan akses simulator; pengelolaan mempertahankan pemeriksaan pemilik; kondisi kosong menyertakan tindakan berikutnya. |
| UX-05 | Simulator kredit | Route /simulasi, harga Rp1 juta–Rp10 miliar, DP 10–80%, tenor 12–60 bulan, bunga flat tahunan 0–25%; hasil berubah saat input diganti. |
| UX-06 | Hasil simulasi | Menampilkan pokok pembiayaan, cicilan dan total; pengguna dapat mengunduh ringkasan TXT dan membuka katalog dengan batas anggaran. Hasil ilustratif, tidak termasuk biaya tambahan atau penawaran bank. |
| UX-07 | Profil & pengaturan | Foto/identitas dan formulir terpisah dengan jelas; nama disimpan ke profiles; tidak ada penulisan avatar inline ke metadata Auth; akses preferensi dan bantuan tersedia. |
| UX-08 | Riwayat | Filter dan ekspor CSV dipertahankan; detail kendaraan menghubungkan tindakan tawar/checkout ke dialog yang sesuai; ekspor dinonaktifkan jika tidak ada hasil. |
| UX-09 | Dialog | Detail, listing, penawaran, checkout, invoice, editor foto dan bantuan memakai kerangka dialog; Escape menutup, Tab tetap di dialog, fokus kembali ke pemicu, overlay berada di atas navigasi/kontak. |
| UX-10 | Bantuan & auth | Panduan fitur dapat dibuka dari sidebar/footer; halaman login/daftar/pemulihan memakai tata letak konsisten dan tetap mempertahankan alur Supabase. |
| UX-11 | Aksesibilitas | Skip link, fokus keyboard terlihat, label kontrol utama, status filter terpilih dan reduced-motion tersedia. Navigasi tertutup tidak menerima fokus pada ponsel. |

### Perhitungan simulator

Pokok pembiayaan = harga dikurangi DP. Bunga total = pokok × bunga flat tahunan × tenor/12. Cicilan = (pokok + bunga total)/tenor. Contoh harga Rp250 juta, DP30%, bunga8% per tahun: tenor36 bulan menghasilkan cicilan sekitar Rp6.027.778; tenor60 bulan sekitar Rp4.083.333. Kalkulasi ini tidak mencakup asuransi, administrasi, atau persetujuan pembiayaan.

### Validasi dan batas rilis

Typecheck, 32 pengujian regresi dan production build lulus. Pemeriksaan browser lokal mencakup desktop1440 px, ponsel375 px, tema terang/gelap, profil admin, filter tambahan, drawer, dialog listing dan penutupan Escape, bantuan, serta perubahan tenor simulator. Katalog mobile tidak memiliki overflow horizontal pada lebar375 px. Pengujian dialog tidak menerbitkan listing uji.

Data marketplace tetap tersimpan pada browser. UI admin mengikuti akses yang tersedia; halaman pengelolaan pengguna/verifikasi dealer belum tersedia. Pembaruan UI memerlukan deployment Vercel dan smoke test ulang sebelum dinyatakan tersedia pada domain publik.


## 15. Penyederhanaan visual — versi 1.5

Palet utama berubah menjadi biru langit, dengan sidebar putih, latar abu kebiruan dan aksen biru pada tindakan utama. Mode gelap memakai navy dan aksen sky yang lebih terang. Banner dashboard/katalog dipadatkan tanpa foto latar, dekorasi dan teks berulang dikurangi, judul halaman mengikuti nama menu, dan kartu memakai garis ringan tanpa bayangan berlebihan. Bantuan profil dipindahkan setelah formulir pada ponsel.

Interaksi: tombol/link mempunyai efek tekan singkat, tindakan utama memiliki halo lembut saat ditekan, halaman masuk dengan fade/geser7 px selama280 ms, ikon navigasi aktif mendapat animasi singkat. Dialog mempertahankan fokus dan Escape. Seluruh animasi/transisi dinonaktifkan bila prefers-reduced-motion aktif.

Perubahan ini hanya memengaruhi presentasi; aturan akses dan penyimpanan data tetap mengikuti bagian sebelumnya. Versi1.5 tersedia pada preview lokal dan belum dipush/dideploy saat penulisan.


Validasi versi1.5: production build dan typecheck lulus; browser lokal memeriksa dashboard terang/gelap pada1440×1000, profil dan katalog pada375×812, filter tambahan serta navigasi profil/simulator. Katalog375 px tidak mengalami overflow horizontal. Perubahan tenor36→60 bulan memperbarui cicilan Rp6.027.778→Rp4.083.333 sesuai formula sebelumnya. Animasi halaman yang diterapkan dikonfirmasi bernama pageEnter. Pengujian ini tidak menerbitkan listing atau melakukan transaksi.


Narahubung pembeli: nomor admin tetap menjadi tujuan bantuan pelanggan. Panel nomor WhatsApp di Pengaturan admin dihapus; tombol bantuan WhatsApp melayang dan kartu kontak profil disembunyikan untuk admin, tetapi tetap tersedia bagi pengguna non-admin. Nomor narahubung yang dikonfigurasi tidak dihapus.


## 16. Narahubung, chat website dan galeri — versi 1.6

### Perilaku produk

- Kartu katalog menampilkan satu tindakan utama **Hubungi Penjual** melalui WhatsApp listing. Tombol Beli Sekarang, Ajukan Tawaran, Detail dan tautan cicilan di kartu dihapus. Foto tetap dapat diketuk untuk membuka informasi dan galeri; favorit tetap tersedia. Detail juga tidak menampilkan tombol pembelian/penawaran baru. Fungsi riwayat simulasi lama dipertahankan untuk membaca data yang sudah tersimpan.
- Menu **Chat** membawa pengguna ke /chat. Pembeli dan dealer sebagai pelanggan dapat memulai satu percakapan bantuan per akun; admin mendapat kotak masuk dan dapat membalas. Tombol bantuan melayang dan kartu bantuan profil menuju chat website. Kontak WhatsApp penjual tetap terpisah.
- Pesan teks tersimpan di Supabase, maksimal2000 karakter; daftar percakapan disegarkan5 detik, pesan percakapan aktif3 detik selama halaman terlihat. Riwayat terbaru50 pesan dapat diperluas. Tidak ada klaim online/terbaca, notifikasi push atau dukungan lampiran pada versi ini. Teks gagal kirim dipertahankan.
- RLS: hanya pemilik percakapan dan admin yang dapat membaca/mengirim. Pengirim harus sesuai auth.uid(); pesan tidak dapat diedit/dihapus client. Role admin diperiksa dari profiles melalui fungsi database, bukan cache/email.
- Listing mendukung0–10 foto, dengan foto pertama sebagai sampul. Unggah beberapa JPG/PNG/WebP sekaligus, maksimal15 MB per sumber, optimasi JPEG sebelum unggah ke Storage; dapat juga menambahkan URL HTTPS. Foto dapat dihapus dari galeri atau dijadikan sampul. Tidak ada fallback diam-diam ke base64 ketika unggah gagal.
- Galeri detail menampilkan thumbnail, tombol sebelumnya/berikutnya dan posisi foto. Listing lama dengan satu field image tetap didukung. Store menormalisasi batas10 pada add/edit/update dan pemuatan data.

### Implementasi dan validasi

Migrasi supabase/migrations/20261028_support_chat.sql telah diterapkan pada proyek Supabase yang terhubung. Pengujian docs/sql/verify-support-chat.sql berhasil untuk buyer baca/kirim, admin baca/balas, penolakan akun luar, pemalsuan sender, pesan2001 karakter dan update pesan. Semua data chat uji di-rollback; tidak ada pesan uji yang ditinggalkan pada akun pembeli.

Typecheck,33 pengujian otomatis dan production build lulus. Pengujian store tambahan memeriksa batas10, sampul, edit, duplikasi, deduplikasi dan URL tidak aman. Browser lokal memeriksa kotak masuk admin tersambung (tanpa error); unggah dua aset repo sekaligus ke Supabase Storage berhasil; pengubahan sampul/penghapusan berhasil; setelah10 foto kontrol penambahan dinonaktifkan. Formulir uji dibatalkan tanpa menerbitkan listing. Dua file uji unggahan berada pada Storage; tidak ada data akun/foto pribadi yang diunggah untuk pengujian ini.

Batas: balas pesan dengan dua akun melalui UI belum diuji karena hanya kredensial admin diberikan; alur database dua peran diuji langsung dengan rollback. Data listing tetap localStorage dan belum sinkron antarperangkat; hanya chat dan file foto yang terpusat. Frontend versi1.6 masih lokal sampai dipush/deploy.


Transisi tema: perubahan light/dark kini menginterpolasi latar, teks, border, ikon dan bayangan selama420 ms. Ikon bulan/matahari memakai crossfade dan rotasi ringan. Efek berlaku juga untuk pemilihan tema di Pengaturan dan perubahan preferensi sistem, tanpa mengubah durasi hover biasa. prefers-reduced-motion tetap menonaktifkan transisi. Build dan typecheck lulus.


## 17. Penemuan dan pengelompokan mobil — versi 1.7

Katalog menyediakan kelompok kebutuhan (MPV/SUV keluarga, anggaran sampaiRp200 juta, kilometer tercatat1–30.000, dan kategori listrik), merek, model, serta tipe kendaraan. Jumlah kelompok dihitung dari listing aktif pada browser; nol tidak diganti angka contoh. Tipe ditambah Wagon, Coupe, Van, dan Pickup. Filter kebutuhan/merek/model dapat dikombinasikan dengan harga, kota, tahun, kategori dan pencarian. Tombol Lihat hasil membawa fokus ke hasil; kelompok aktif dapat dihapus satu per satu.

Formulir listing mempunyai merek/model terpisah. Listing lama memakai inferensi merek dari awal judul dan model dari kata pertama setelah merek yang dikenal; nilai eksplisit lebih diutamakan. Listing yang tidak dapat diidentifikasi masuk Lainnya, tanpa menebak atribut kendaraan dari foto. Data yang disimpan dan diubah dibatasi panjangnya.

Fitur relevansi tambahan: salin tautan pencarian yang menyertakan merek/model/kelompok/tipe/harga/kota/tahun/urutan; model disaring berdasarkan merek; permintaan Bantu cari mobil menyiapkan draf kebutuhan dan anggaran pada chat admin untuk pembeli/dealer. Tidak ada pengiriman pesan otomatis. Pengunjung diarahkan login. Kelompok bukan klaim inspeksi, jaminan kondisi, persetujuan kredit atau prediksiAI.

Validasi otomatis:38 tes lulus, mencakup inferensi listing lama, batas harga/km, kombinasi merek-model-kelompok, serta penyimpanan merek/model/tipe tambahan melalui store. Typecheck dan production build lulus. Data katalog tetap lokal pada browser; frontend versi1.7 belum dipush/deploy pada saat dokumen diperbarui.


Pemeriksaan browser versi1.7: kombinasi Toyota+Mobil keluarga mengaktifkan kedua penanda; tautan /beli?brand=Toyota&group=family memulihkan pilihan; salin tautan mendapat konfirmasi sukses; Lihat hasil memindahkan fokus ke ringkasan hasil; reset menghapus pilihan. Desktop1440 px dan ponsel375 px diperiksa, tanpa overflow horizontal pada375 px. Tidak ada listing contoh yang diterbitkan untuk pengujian.

Identitas visual katalog: 24 merek memiliki aset logo lokal dengan pemetaan sesuai nama merek. Proporsi dan warna logo dipertahankan; latar putih menjaga keterbacaan pada tema terang dan gelap. Merek yang tidak dikenal menggunakan ikon mobil umum. Sumber aset dicatat pada public/images/brands/sources.json dan README.md. Sembilan tipe kendaraan memakai siluet SVG berbeda, termasuk bak terbuka Pickup, bodi Van, serta simbol petir Listrik. Label teks dan fungsi filter tetap tersedia. Logo yang ditampilkan berhasil dimuat pada browser; susunan desktop dan ponsel375 px serta tema gelap diperiksa. Typecheck dan production build lulus setelah penambahan aset. Perubahan ini masih lokal.

## 18. Katalog dummy — versi 1.8

Pada pembukaan katalog pertama, aplikasi menambahkan tepat50 listing demo:24 merek,9 tipe bodi,10 kota, serta variasi harga/tahun/kilometer. ID tetap dan penanda inisialisasi mencegah duplikasi saat refresh atau ganti akun; listing lama tetap disimpan. Jika listing demo dihapus setelah inisialisasi, refresh tidak membuatnya kembali. Total katalog dapat melebihi50 apabila sudah ada listing pengguna.

Data diberi label Data demo pada kartu/detail dan keterangan katalog. Harga dan spesifikasi adalah contoh buatan, bukan penilaian pasar. Sembilan ilustrasi SVG lokal sesuai tipe digunakan sebagai gambar; tidak diklaim sebagai foto model/unit asli. Kontak penjual demo tidak tersedia; tidak ada nomor pribadi atau pesan WhatsApp yang dihasilkan. Favorit, filter, detail, dan simulasi tetap dapat dicoba. Listing pengguna tetap memakai kontak seperti biasa.

Penyimpanan tetap pada browser (shared localStorage), bukan tabel listing Supabase.41 tes lulus, termasuk jumlah/keunikan/cakupan demo, aset ilustrasi tersedia, preservasi listing lama, dan idempotensi setelah penghapusan. Typecheck dan production build lulus. Browser menunjukkan50 dari50 mobil aktif; filter Toyota+keluarga menghasilkan3 mobil, dan seluruh50 ilustrasi berhasil dimuat. Perubahan versi1.8 masih lokal, belum dipush/deploy.

## 19. Foto referensi dan kemudahan penggunaan pembeli — versi 1.9

Seluruh50 listing demo sekarang memakai foto referensi merek/model dari Wikimedia Commons, menggantikan ilustrasi tipe. Warna, varian, pasar, dan tahun foto dapat berbeda dari spesifikasi dummy; keterangan ini tersedia pada detail. Penulis, tautan sumber dan lisensi ditampilkan pada kartu serta detail; manifest lengkap disimpan di public/images/demo-cars/photo-sources.json. Foto dioptimalkan menjadi total sekitar5,7 MB dan kartu memuat gambar secara bertahap. Pembaruan data browser hanya mengganti gambar SVG bawaan pada ID demo yang sesuai, mempertahankan listing pengguna, perubahan identitas model, foto khusus, harga, catatan, dan penghapusan sebelumnya.

Alur awal pembeli/pengunjung mengutamakan pencarian nama mobil dan anggaran. Merek/model/kota/tahun berada di Filter lainnya; pengelompokan kebutuhan/merek/tipe tersedia dalam panel opsional. Delapan merek utama tampil saat panel dibuka, merek lain melalui tombol perluasan. Filter aktif tetap terlihat di luar panel dan dapat dibatalkan satu per satu. Reset membersihkan parameter URL agar refresh tidak memulihkan filter lama. Kartu menyediakan petunjuk Lihat detail; statistik minat/waktu buatan tidak ditampilkan pada mobil demo.

Navigasi pembeli memakai istilah Cari Mobil, Mobil Favorit, Hitung Cicilan, Chat Admin, dan Aktivitas Saya. Hak akses tetap mengikuti role; pembeli tidak mendapat kontrol widget dashboard penjualan. Panduan menjelaskan pencarian, foto/detail, favorit, perkiraan cicilan, serta kontak penjual/admin. Pengaturan memakai bahasa akun/tampilan. Perbaikan ini bertujuan mengurangi pilihan yang perlu dipahami sekaligus; keberhasilan penggunaan dengan klien belum diuji langsung.

Validasi:43 tes otomatis, typecheck dan production build lulus. Pengujian foto mencakup asetJPEG, kecocokan metadata merek/model, atribusi50 foto, serta migrasi yang mempertahankan data/foto khusus. Tampilan dan pencarian diperiksa pada browser desktop1440 px dan ponsel375 px; pencarian Brio menghasilkan1 mobil. Perubahan masih lokal, belum dipush/deploy.

## 20. Navigasi etalase pembeli dan detail mobil — versi 1.10

Pembeli dan pengunjung memakai navigasi atas pada desktop (Cari Mobil, Favorit, Chat, Hitung Cicilan dan menu akun); pada layar di bawah1024 px tersedia menu bawah Cari Mobil, Favorit, Chat dan Akun. Halaman akun tetap menyediakan profil, aktivitas, pengaturan, dan cicilan; pengunjung yang membuka halaman terlindungi diarahkan login. Admin/dealer mempertahankan sidebar dan pemeriksaan hak akses. Tombol chat melayang pembeli dihapus karena chat tersedia pada navigasi; dealer tetap mendapat tombol tersebut.

Banner dan keterangan katalog dipadatkan. Pada ponsel penjelasan pembuka disembunyikan, jumlah hasil serta tautan cicilan berada dalam satu baris, dan pilihan anggaran dapat digeser horizontal. Panel merek/tipe tetap opsional. Kartu memakai foto lebih besar dan tidak mengulang tahun/km pada deretan label. Kredit foto tetap tersedia. Detail menyediakan galeri, harga, tabel spesifikasi tahun/km/lokasi/tipe, deskripsi, favorit dan kontak pada footer yang tetap terlihat selama isi digulir. Listing tanpa nomor penjual tidak membuat nomor kontak contoh. Mobil demo tetap tidak dapat dihubungi sebagai barang jualan.

Tautan Hitung cicilan mobil ini meneruskan harga ke simulator. Istilah menggunakan uang muka, lama cicilan dan sisa harga yang dicicil; bantuan singkat menjelaskan uang muka serta konversi12 bulan menjadi1 tahun. Rumus pembiayaan tidak berubah.

Validasi: typecheck,43 pengujian otomatis dan build produksi lulus. Browser desktop1440 px dan ponsel375 px diperiksa. Pada375×812 foto pertama dimulai sekitar619 px, di atas menu bawah sekitar749 px; lebar konten375 px. Menu Akun pengunjung menuju login; detail dan footer diperiksa pada ponsel; Avanza meneruskan harga185000000 ke simulator. Uji kegunaan langsung dengan klien belum dilakukan. Perubahan masih lokal dan belum dipush/deploy.

## 21. Penyempurnaan kartu, detail, dan bahasa cicilan — versi 1.11

Kartu katalog mengutamakan nama lalu harga dengan aksen biru; kilometer/kota dan tipe menjadi informasi pendukung. Nama dapat dibuka melalui tombol yang mendukung keyboard. Tombol favorit menyebutkan nama mobil dan status simpan melalui label aksesibel serta aria-pressed. Kredit foto tetap ditampilkan di bawah informasi listing.

Detail menampilkan nama panjang tanpa pemotongan satu baris. Spesifikasi membedakan kilometer yang belum diisi; listing asli memiliki bagian penjual dan petunjuk membuka WhatsApp untuk menanyakan ketersediaan, kondisi, serta jadwal melihat unit. Tombol kontak diperbesar pada ponsel, dalam footer di luar area gulir isi. Data demo tetap tidak menghasilkan kontak penjual.

Cicilan dibagi menjadi tiga langkah: harga mobil, uang muka, dan lama cicilan. Pilihan menampilkan tahun sekaligus bulan; penjelasan bunga flat dan isian bunga berada di panel yang dapat dibuka. Ponsel/tablet mendapat ringkasan perkiraan di atas formulir; ringkasan lengkap tetap tersedia di bawah/di samping. Isian harga/bunga mempunyai petunjuk dan status validasi; penyimpanan hasil dinonaktifkan untuk isian tidak valid. Rumus tidak berubah. Pergantian halaman sekarang mereset posisi gulir wadah aplikasi dan menutup menu yang terbuka.

Validasi: typecheck,43 tes otomatis, serta build produksi lulus. Browser memeriksa kartu desktop, pembukaan detail melalui nama, perpindahan harga185000000 dari Avanza ke cicilan, serta lebar375 px tanpa overflow. Contoh harga185 juta/uang muka30%/bunga flat8%:24 bulan menampilkan6259167 per bulan;36 bulan menampilkan4460556. Mengosongkan harga memberi aria-invalid=true dan menonaktifkan simpan. Navigasi detail→cicilan mengembalikan scrollTop wadah ke0. Perubahan masih lokal, belum dipush/deploy; evaluasi kegunaan langsung dengan klien belum dilakukan.

## 22. Penyempurnaan visual dan interaksi (v1.12)

Tampilan pembeli mengambil inspirasi hierarki visual dan penyajian produk dari https://www.apple.com, dengan identitas biru langit AutoBuyCars. Judul lebih tegas, permukaan netral, kartu membulat, navigasi transparan, dan foto kendaraan menjadi fokus. Alur katalog, kontak penjual, chat, serta rumus simulasi tetap menggunakan implementasi sebelumnya.

Interaksi: transisi masuk halaman 450 ms, dialog 320 ms, kartu terangkat dan foto membesar ringan pada perangkat dengan hover, penanda tenor terpilih, serta animasi singkat saat hasil cicilan berubah. Efek baru menghormati prefers-reduced-motion. Ringkasan cicilan tetap terlihat saat menggulir di desktop lebar; ponsel mempertahankan ringkasan di atas formulir.

Validasi: build produksi, TypeScript, dan git diff --check lulus. Pratinjau katalog dan simulasi diperiksa pada desktop 1440 px; simulasi mode gelap pada 375 px tidak meluap horizontal. Pilihan 24 bulan dengan harga Rp185 juta, DP30%, bunga flat8% menghasilkan Rp6.259.167 per bulan. Perubahan masih lokal, belum dipush atau dideploy.
