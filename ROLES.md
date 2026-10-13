# Dokumentasi Sistem Role - AutoBuyCars

## Overview
AutoBuyCars menggunakan sistem role-based access control (RBAC) dengan 4 role utama yang sesuai dengan kebutuhan aplikasi jual beli mobil.

## Role & Hierarchy

```
Admin (Level 4) - Full system access
  ↓
Dealer (Level 3) - Seller/Penjual terverifikasi
  ↓
Buyer (Level 2) - User biasa yang beli mobil
  ↓
Guest (Level 1) - Pengunjung belum login
```

## Detail Role

### 1. **Admin** (Administrator)
**Fungsi**: Mengelola seluruh sistem, verifikasi dealer, moderasi listing

**Permissions**:
- ✅ Full CRUD listing (semua)
- ✅ Approve/reject listing
- ✅ Kelola user (edit, ban, verify dealer)
- ✅ View semua analytics & transaksi
- ✅ Export data
- ✅ Ubah system settings

**Use Case**:
- Verifikasi dealer baru
- Moderasi listing yang dilaporkan
- Monitor performa platform
- Handle dispute antara buyer-seller

### 2. **Dealer** (Penjual/Seller)
**Fungsi**: Menjual mobil, kelola listing sendiri

**Permissions**:
- ✅ Create listing (perlu approval admin)
- ✅ Edit/delete listing sendiri
- ✅ Accept/reject offer untuk listing sendiri
- ✅ View analytics sendiri (performa listing, revenue)
- ✅ Export data sendiri
- ✅ Kontak seller lain & buyer
- ❌ Tidak bisa beli mobil (fokus jual)
- ❌ Tidak bisa approve listing

**Use Case**:
- Showroom/dealer resmi yang jual banyak mobil
- Individual yang jual mobil secara profesional
- Butuh verifikasi dari admin (untuk trust & credibility)

### 3. **Buyer** (Pembeli)
**Fungsi**: Membeli mobil, ajukan penawaran

**Permissions**:
- ✅ Beli mobil
- ✅ Ajukan penawaran (tawar harga)
- ✅ View & manage transaksi sendiri
- ✅ Favorit mobil
- ✅ Kontak seller via WhatsApp
- ✅ View analytics transaksi sendiri
- ❌ Tidak bisa create listing
- ❌ Tidak bisa accept/reject offer

**Use Case**:
- User umum yang cari mobil
- Bisa nawar harga ke dealer
- Track riwayat pembelian

### 4. **Guest** (Pengunjung)
**Fungsi**: Lihat listing, lead generation

**Permissions**:
- ✅ View listing (browse mobil)
- ✅ Kontak seller via WhatsApp (untuk lead generation)
- ❌ Tidak bisa beli/tawar
- ❌ Tidak bisa favorit
- ❌ Tidak bisa akses dashboard

**Use Case**:
- Visitor yang belum daftar
- Lead generation (kontak via WhatsApp untuk convert jadi buyer)

## Permission Matrix

| Permission | Admin | Dealer | Buyer | Guest |
|-----------|-------|--------|-------|-------|
| **Listing Management** |
| Create Listing | ✅ | ✅ | ❌ | ❌ |
| Edit Own Listing | ✅ | ✅ | ❌ | ❌ |
| Edit Any Listing | ✅ | ❌ | ❌ | ❌ |
| Delete Own Listing | ✅ | ✅ | ❌ | ❌ |
| Delete Any Listing | ✅ | ❌ | ❌ | ❌ |
| Approve/Reject Listing | ✅ | ❌ | ❌ | ❌ |
| **Transaction** |
| Make Offer (Tawar) | ✅ | ❌ | ✅ | ❌ |
| Accept/Reject Offer | ✅ | ✅ | ❌ | ❌ |
| Buy Car | ✅ | ❌ | ✅ | ❌ |
| View Own Transactions | ✅ | ✅ | ✅ | ❌ |
| View All Transactions | ✅ | ❌ | ❌ | ❌ |
| **User Management** |
| View Users | ✅ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ | ❌ |
| Ban Users | ✅ | ❌ | ❌ | ❌ |
| Verify Dealer | ✅ | ❌ | ❌ | ❌ |
| **Analytics & Reports** |
| View Own Analytics | ✅ | ✅ | ✅ | ❌ |
| View All Analytics | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| **Communication** |
| Contact Seller (WhatsApp) | ✅ | ✅ | ✅ | ✅ |
| Receive Offers | ✅ | ✅ | ❌ | ❌ |
| Send Messages | ✅ | ✅ | ✅ | ❌ |
| **System** |
| Access Dashboard | ✅ | ✅ | ✅ | ❌ |
| Change Settings | ✅ | ❌ | ❌ | ❌ |

## Role Transitions (Upgrade/Downgrade)

```
Guest → Buyer
  Trigger: User register/sign up
  Auto: Ya

Buyer → Dealer
  Trigger: Apply sebagai dealer
  Auto: Tidak (butuh approval admin)
  Requirement:
    - Verifikasi identitas
    - Dokumen usaha (jika dealer resmi)
    - Review oleh admin

Dealer → Buyer
  Trigger: Downgrade manual atau pelanggaran
  Auto: Tidak (butuh approval admin)
```

## Integrasi dengan Supabase

### Database Schema (Rekomendasi)

```sql
-- Tabel users (extend dari auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin', 'dealer', 'buyer', 'guest')),
  display_name TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  dealer_info JSONB, -- untuk dealer: { business_name, address, license_no }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa read profile sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: User bisa update profile sendiri (kecuali role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admin bisa view semua profile
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admin bisa update role
CREATE POLICY "Admins can update roles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Implementasi di Kode

### 1. Get User Role
```typescript
import { createClient } from "@/lib/supabase/server";
import { getPermissions } from "@/lib/roles";

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

### 2. Check Permission
```typescript
import { hasPermission } from "@/lib/roles";

// Di component
const userRole = await getUserRole();
const canCreate = hasPermission(userRole, "canCreateListing");

if (canCreate) {
  // Show create listing button
}
```

### 3. Protect Route
```typescript
// app/admin/page.tsx
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth";

export default async function AdminPage() {
  const role = await getUserRole();
  
  if (role !== "admin") {
    redirect("/dashboard");
  }
  
  return <AdminDashboard />;
}
```

## WhatsApp Integration dengan Role

### Guest/Buyer → Contact Seller
```typescript
// Di halaman listing
<WhatsAppContact
  phoneNumber={listing.seller_phone}
  message={`Halo, saya tertarik dengan ${car.title} (${car.year}). Apakah masih tersedia?`}
>
  Hubungi Penjual
</WhatsAppContact>
```

### Dealer → Request Verification
```typescript
// Di halaman "Jual Mobil"
<WhatsAppContact
  phoneNumber={config.whatsapp.phoneNumber}
  message="Halo, saya ingin menambahkan listing mobil untuk dijual. Mohon bantuannya untuk proses verifikasi."
>
  Hubungi untuk Listing
</WhatsAppContact>
```

## Best Practices

1. **Default Role**: User baru = `buyer` (bukan guest)
2. **Guest**: Hanya untuk unauthenticated user
3. **Dealer Verification**: Manual review oleh admin (quality control)
4. **Role Changes**: Log semua perubahan role untuk audit trail
5. **Testing**: Test setiap permission dengan semua role

## Roadmap (Future Enhancement)

- [ ] Sub-roles: `dealer_premium`, `dealer_verified`
- [ ] Permission groups/presets
- [ ] Custom permissions per user
- [ ] Role expiry (dealer subscription)
- [ ] Multi-level approval workflow
