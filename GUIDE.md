# Panduan Lengkap Penggunaan AutoBuyCars

Aplikasi platform jual beli mobil modern dengan sistem role-based access control (RBAC), verifikasi email OTP, integrasi WhatsApp, dan mode jelajah tanpa masuk (guest).

---

## 🚀 Alur Penggunaan Aplikasi (User Flow)

### 1. Halaman Masuk / Login (`/login`)
- **Login Email & Password**: Masukkan email dan password terdaftar.
- **Login Google**: Masuk cepat dengan akun Google OAuth.
- **Jelajahi Tanpa Masuk**: Tombol khusus bagi pengunjung (guest) untuk langsung melihat daftar mobil di halaman **Beli** dan **Dashboard** tanpa harus register/login terlebih dahulu.
- **Lupa Kata Sandi**: Fitur reset password via email (`/forgot-password`).

### 2. Pendaftaran Akun & Verifikasi OTP (`/register` → `/verify-email`)
- **Daftar**: Masukkan nama lengkap, email, dan password (dengan indikator kekuatan sandi).
- **Verifikasi OTP**: Setelah daftar, sistem mengirimkan kode verifikasi 6 digit ke email. Masukkan kode tersebut pada halaman verifikasi dengan fitur auto-focus dan paste otomatis.
- **Pilih Peran (Choose Role)**: Setelah verifikasi berhasil, user baru diarahkan ke halaman `/choose-role` untuk memilih peran mereka secara interaktif.

### 3. Pemilihan Peran (`/choose-role`)
Setiap user baru dapat memilih peran sesuai kebutuhan:
- 🚗 **Pembeli (Buyer)**: Fokus untuk mencari, menawar, dan membeli mobil.
- 🏪 **Penjual / Dealer**: Fokus untuk mengunggah listing mobil, mengelola status jualan, dan menerima penawaran.
- *(Catatan)*: Akun khusus **Admin** dapat diset langsung melalui database Supabase (lihat `ADMIN_SETUP.md`).

---

## 👥 Fitur Berdasarkan Role

### 🛡️ **Administrator (Admin)**
- **Badge**: Merah eksklusif.
- **Fungsi Utama**:
  - Mengelola seluruh listing di platform.
  - Memverifikasi dealer baru.
  - Memantau analitik dan revenue seluruh pengguna.
  - Mengatur sistem dan konfigurasi.

### 🏪 **Dealer / Penjual**
- **Badge**: Ungu profesional.
- **Fungsi Utama**:
  - **Jual Mobil (`/jual`)**: Tambah listing baru dengan detail lengkap (harga, tahun, km, lokasi, kategori, gambar URL/fallback).
  - **Kontak Verifikasi WhatsApp**: Tombol khusus di halaman Jual untuk menghubungi admin terkait verifikasi listing.
  - **Kelola Status**: Ubah status listing (Menunggu → Dijual → Terjual).
  - **Penawaran Masuk**: Terima atau tolak penawaran harga dari pembeli.

### 🚗 **Pembeli (Buyer)**
- **Badge**: Biru kepercayaan.
- **Fungsi Utama**:
  - **Beli Mobil (`/beli`)**: Browse mobil dengan filter lengkap (kategori, kota se-Indonesia, rentang harga, tahun, pencarian teks).
  - **Detail & Gambar**: Lihat foto mobil dengan fallback otomatis jika URL gambar eksternal gagal dimuat.
  - **Ajukan Penawaran**: Kirim penawaran harga ke penjual.
  - **Checkout / Pembelian**: Pilih metode Tunai atau Kredit dengan kalkulator cicilan otomatis.
  - **Favorit (`/favorit`)**: Simpan mobil impian ke daftar favorit.

### 👤 **Pengunjung (Guest)**
- **Badge**: Abu-abu netral.
- **Fungsi Utama**:
  - Akses bebas ke halaman **Dashboard** dan **Beli Mobil** tanpa login.
  - Dapat menghubungi penjual via WhatsApp (lead generation).
  - Prompt untuk Login/Daftar jika ingin melakukan transaksi atau jual mobil.

---

## 📱 Fitur Tambahan Global

- **WhatsApp Floating Button**: Tombol mengapung di pojok kanan bawah untuk terhubung langsung ke layanan pelanggan / WhatsApp penawar.
- **Dark Mode**: Toggle tema gelap/terang di pojok kanan atas dengan persistensi otomatis.
- **Riwayat Aktivitas (`/riwayat`)**: Log semua aktivitas (beli, jual, tawar, favorit) dengan opsi export ke CSV.
- **Profil & Pengaturan (`/profil`, `/pengaturan`)**: Kelola nama tampilan sapaan, target penjualan bulanan, dan visibilitas widget dashboard.
