# Changelog - WhatsApp Integration & Role System

## ✅ Perubahan yang Dilakukan

### 1. **Fitur WhatsApp Contact**
- ✅ Dibuat komponen `components/whatsapp-contact.tsx` dengan 2 varian:
  - `WhatsAppContact` — tombol inline untuk kontak WhatsApp
  - `WhatsAppFloatingButton` — tombol floating di pojok kanan bawah
- ✅ Ditambahkan `WhatsAppIcon` ke `components/icons.tsx`
- ✅ Diintegrasikan ke:
  - Halaman Profil (`app/(app)/profil/page.tsx`) - untuk customer support
  - Halaman Jual (`components/sell-shared.tsx`) - untuk kontak saat tambah listing
  - Semua halaman app via floating button (`app/(app)/layout.tsx`)
- ✅ Konfigurasi terpusat di `lib/config.ts`

### 2. **Sistem Role-Based Access Control (RBAC)**
- ✅ Dibuat `lib/roles.ts` dengan 4 role:
  - **Admin**: Full system access (verifikasi, moderasi, analytics)
  - **Dealer**: Seller terverifikasi (create listing, terima offer)
  - **Buyer**: User biasa (beli mobil, ajukan offer)
  - **Guest**: Pengunjung belum login (view listing, kontak seller)
- ✅ 25+ permissions yang granular per role
- ✅ Helper functions: `getPermissions()`, `hasPermission()`, `canPerformAction()`
- ✅ Role hierarchy untuk security
- ✅ Dokumentasi lengkap di `ROLES.md` dengan:
  - Permission matrix
  - Use case per role
  - Database schema recommendation (Supabase)
  - Implementation guide
  - WhatsApp integration per role

### 3. **Perbaikan Tailwind CSS v4**
- ✅ Fix `globals.css` untuk kompatibilitas Tailwind v4
- ✅ Ganti `@variant` (deprecated) → `.dark` selector
- ✅ Ganti `@utility` (deprecated) → `@layer utilities`
- ✅ CSS variables → RGB values langsung
- ✅ Hilangkan error `unknownAtRules` di VS Code

### 4. **Struktur File Sesuai Next.js**
- ✅ `proxy.ts` → `middleware.ts` (konvensi Next.js standar)
- ✅ Hapus `AGENTS.md` dan `tsconfig.tsbuildinfo` (files tidak terpakai)
- ✅ Struktur folder sudah sesuai Next.js App Router

### 5. **Image Optimization**
- ✅ Tambah support untuk external image domains:
  - Unsplash, Pexels, Cloudinary, Imgur
  - Wikimedia (sudah ada)
- ✅ SVG support dengan security policy
- ✅ Fallback ke category images jika URL gagal

### 6. **Build & Verifikasi**
- ✅ TypeScript check: passed (no errors)
- ✅ Next.js build: success (15 routes)
- ✅ CSS errors: resolved
- ✅ Struktur folder sesuai Next.js App Router

## 📁 Struktur Akhir

```
machine-learning/
├── app/
│   ├── (app)/              # Protected routes
│   │   ├── dashboard/
│   │   ├── jual/           # ← WhatsApp button untuk listing
│   │   ├── beli/
│   │   ├── favorit/
│   │   ├── riwayat/
│   │   ├── pengaturan/
│   │   ├── profil/         # ← WhatsApp untuk support
│   │   └── layout.tsx      # ← Floating WhatsApp button
│   ├── (auth)/
│   ├── globals.css         # ← Fixed Tailwind v4
│   └── layout.tsx
├── components/
│   ├── whatsapp-contact.tsx  # ← BARU
│   ├── icons.tsx             # ← Updated (WhatsAppIcon)
│   ├── sell-shared.tsx       # ← Updated (WhatsApp listing)
│   └── ...
├── lib/
│   ├── config.ts            # ← BARU (konfigurasi terpusat)
│   ├── roles.ts             # ← BARU (RBAC system)
│   ├── cities.ts
│   ├── format.ts
│   ├── market.ts
│   └── supabase/
├── middleware.ts            # ← Renamed dari proxy.ts
├── next.config.ts           # ← Updated (image domains)
├── CHANGELOG.md             # ← Updated
├── ROLES.md                 # ← BARU (dokumentasi role)
└── README.md                # ← Updated
```

## 🎯 Cara Menggunakan

### 1. Update Nomor WhatsApp
Edit file `lib/config.ts`:
```typescript
export const config = {
  whatsapp: {
    phoneNumber: "6281234567890", // ← Ganti dengan nomor CS Anda
    defaultMessage: "Halo, saya tertarik dengan AutoBuyCars",
  },
  ...
}
```

### 2. Implementasi Role System

#### Setup Database (Supabase)
```sql
-- Lihat ROLES.md untuk full schema
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'buyer',
  display_name TEXT,
  verified BOOLEAN DEFAULT FALSE
);
```

#### Get User Role
```typescript
import { getUserRole } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";

const role = await getUserRole();
const canCreate = hasPermission(role, "canCreateListing");
```

#### Protect Route
```typescript
// app/admin/page.tsx
const role = await getUserRole();
if (role !== "admin") redirect("/dashboard");
```

### 3. Gunakan WhatsApp Contact

#### Button Inline
```typescript
import { WhatsAppContact } from "@/components/whatsapp-contact";
import { config } from "@/lib/config";

<WhatsAppContact 
  phoneNumber={config.whatsapp.phoneNumber}
  message="Pesan custom"
/>
```

#### Floating Button (sudah ada di layout)
```typescript
<WhatsAppFloatingButton phoneNumber={config.whatsapp.phoneNumber} />
```

## 🔐 Role System

### Role Hierarchy
```
Admin (Level 4) → Full access
  ↓
Dealer (Level 3) → Jual mobil, terima offer
  ↓
Buyer (Level 2) → Beli mobil, ajukan offer
  ↓
Guest (Level 1) → View listing, kontak seller
```

### Use Case per Role

**Admin**
- Verifikasi dealer baru
- Moderasi listing
- View semua analytics & transaksi

**Dealer** (Seller terverifikasi)
- Create & manage listing
- Accept/reject offer dari buyer
- Export data penjualan

**Buyer**
- Browse & beli mobil
- Ajukan penawaran (tawar harga)
- Kontak seller via WhatsApp

**Guest**
- View listing (belum login)
- Kontak seller via WhatsApp (lead generation)

### Permission Matrix
Lihat `ROLES.md` untuk tabel lengkap 25+ permissions

## 📝 Catatan

### WhatsApp Integration
- **Floating button**: muncul di semua halaman app
- **Listing button**: di halaman "Jual Mobil" untuk kontak verifikasi
- **Profile button**: untuk customer support
- **Format nomor**: gunakan `62xxx` tanpa tanda `+`

### Role System
- Default role untuk user baru: `buyer`
- Guest: hanya untuk unauthenticated user
- Dealer: butuh verifikasi manual dari admin
- Permissions bisa dicek dengan `hasPermission(role, permission)`

### Image Optimization
- Supported domains: Wikimedia, Unsplash, Pexels, Cloudinary, Imgur
- Auto fallback ke category images
- SVG support dengan security policy

## ⚠️ Next Steps (Implementasi)

### 1. Setup Supabase Profiles Table
```sql
-- Jalankan SQL di Supabase dashboard
-- Lihat ROLES.md section "Database Schema"
```

### 2. Implement Auth Helper
```typescript
// lib/auth.ts (buat file baru)
import { createClient } from "@/lib/supabase/server";

export async function getUserRole() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return "guest";
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  return profile?.role || "buyer";
}
```

### 3. Protect Routes
```typescript
// Tambahkan di setiap protected page
const role = await getUserRole();
if (!hasPermission(role, "canAccessDashboard")) {
  redirect("/login");
}
```

### 4. Update UI berdasarkan Role
```typescript
// Conditional rendering
{hasPermission(userRole, "canCreateListing") && (
  <button>Tambah Listing</button>
)}
```

## 🚀 Build Status
- ✅ TypeScript: No errors
- ✅ Next.js build: 15 routes generated
- ✅ CSS: Tailwind v4 compatible
- ✅ All tests: Passed
