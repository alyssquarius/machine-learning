# Panel pencarian terpadu dan animasi

AntiSlop During. Referensi adalah screenshot AutoBuyCars dari pengguna. Palet biru langit dan putih dipertahankan. ENERGY 2 / RHYTHM 2 / MOTION 2, dengan gerakan singkat untuk umpan balik interaksi.

Susunan: pilihan kebutuhan, pencarian dan urutan, anggaran, merek, tipe mobil, filter rinci, lalu tautan simulasi. Satu formulir menggantikan dua panel terpisah. Pilihan kebutuhan dan dropdown merek yang berulang dihapus. Model dipilih setelah merek dipilih melalui logo.

## Delivery Gate

- Hard Gate PASS: browser menemukan satu formulir buyer-search, nol panel catalog-browse-options, dan nol kelompok kebutuhan duplikat. Memilih Honda dan Brio menghasilkan satu mobil. Panel filter tertutup memiliki atribut inert dan model tidak muncul dalam pohon aksesibilitas. Lebar dokumen sama dengan viewport pada 320px dan 390px.
- Purpose Gate PASS: garis pemisah membedakan kelompok pencarian dalam satu panel. Logo merek merupakan aset lama dan menyatakan merek kendaraan. Biru menandai pilihan aktif. Tidak ada aset, klaim, atau navigasi fiktif baru.
- Liveliness PASS: animasi 160–240ms menandai hover, pilihan merek, panel yang dibuka, filter aktif, dan kartu yang baru dimuat. Tidak ada animasi berulang atau stagger massal. prefers-reduced-motion menonaktifkan animasi dan transisi. Susunan DOM mengikuti urutan visual, tanpa CSS order yang mengacaukan urutan Tab.
- Craftsmanship PASS: build produksi, TypeScript, 52 tes, Prettier, dan git diff --check lulus. Browser menguji pilihan merek/model, buka/tutup filter, perluasan 8 menjadi 24 merek, serta tampilan desktop dan ponsel. Log galat browser kosong saat diperiksa. Panel filter memiliki transisi 0,24s dan 0,16s; kontrol yang tersembunyi tidak dapat difokuskan.

Pembatasan 12 etalase dan tombol penambahan hasil dipertahankan. Perubahan masih lokal dan belum di-push.
