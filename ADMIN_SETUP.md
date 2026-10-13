# Setup Admin Account - AutoBuyCars

Panduan membuat akun admin untuk AutoBuyCars.

## Cara 1: Via Supabase Dashboard (Recommended)

### Step 1: Buat User di Auth
1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add User" / "Invite User"
3. Isi:
   - Email: `admin@autobuycars.com`
   - Password: `[password-kuat-anda]`
   - Auto Confirm User: **Centang** (skip email verification)
4. Klik "Create User"

### Step 2: Set Role Admin di Database
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan query berikut (ganti `[USER_ID]` dengan ID dari user yang baru dibuat):

```sql
-- Insert/Update profile dengan role admin
INSERT INTO profiles (id, role, display_name, verified, created_at, updated_at)
VALUES (
  '[USER_ID]',
  'admin',
  'Administrator',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  display_name = 'Administrator',
  verified = true,
  updated_at = NOW();
```

**Cara dapat USER_ID:**
- Kembali ke Authentication → Users
- Copy ID dari user `admin@autobuycars.com`

### Step 3: Verifikasi
1. Login ke aplikasi dengan email `admin@autobuycars.com`
2. Cek apakah punya akses admin (bisa approve listing, manage users, dll)

---

## Cara 2: Via SQL Script (All-in-One)

Jika Supabase sudah setup dengan profiles table:

```sql
-- Buat akun admin sekaligus
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Buat user di auth.users (ganti email & password)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@autobuycars.com',
    crypt('AdminPassword123!', gen_salt('bf')), -- Ganti password ini
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrator"}',
    NOW(),
    NOW()
  )
  RETURNING id INTO admin_id;
  
  -- Buat profile dengan role admin
  INSERT INTO profiles (id, role, display_name, verified, created_at, updated_at)
  VALUES (
    admin_id,
    'admin',
    'Administrator',
    true,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Admin account created with ID: %', admin_id;
END $$;
```

**⚠️ Security Warning:**
- Ganti `AdminPassword123!` dengan password yang kuat
- Script ini hanya untuk development/setup awal
- Di production, gunakan password manager

---

## Cara 3: Via API (Programmatic)

Jika punya akses Supabase Service Role Key:

```typescript
// scripts/create-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role key!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  // 1. Create user
  const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
    email: 'admin@autobuycars.com',
    password: 'AdminPassword123!', // Ganti dengan password kuat
    email_confirm: true, // Skip email verification
    user_metadata: {
      full_name: 'Administrator'
    }
  });

  if (signUpError) {
    console.error('Error creating user:', signUpError);
    return;
  }

  console.log('User created:', userData.user.id);

  // 2. Set role to admin
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userData.user.id,
      role: 'admin',
      display_name: 'Administrator',
      verified: true
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('✅ Admin account created successfully!');
  console.log('Email: admin@autobuycars.com');
  console.log('Login at: /login');
}

createAdmin();
```

Run dengan:
```bash
npx tsx scripts/create-admin.ts
```

---

## Multiple Admin Accounts

Untuk membuat lebih dari 1 admin:

```sql
-- Admin 1
INSERT INTO profiles (id, role, display_name, verified)
VALUES ('[USER_ID_1]', 'admin', 'Admin Utama', true);

-- Admin 2
INSERT INTO profiles (id, role, display_name, verified)
VALUES ('[USER_ID_2]', 'admin', 'Admin Operasional', true);
```

---

## Upgrade User Existing ke Admin

Jika sudah ada user yang ingin dijadikan admin:

```sql
-- Ganti [USER_EMAIL] dengan email user
UPDATE profiles
SET 
  role = 'admin',
  verified = true,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = '[USER_EMAIL]'
);
```

---

## Testing Admin Access

Setelah membuat admin, test dengan login dan cek:

1. ✅ Bisa akses semua halaman
2. ✅ Bisa approve/reject listing di halaman Jual
3. ✅ Bisa lihat analytics semua user
4. ✅ Bisa manage user (coming soon)
5. ✅ Bisa verify dealer (coming soon)

---

## Default Credentials (untuk Development)

**⚠️ HANYA UNTUK DEVELOPMENT - HAPUS DI PRODUCTION!**

```
Email: admin@autobuycars.com
Password: Admin123!@#

Email: dealer@autobuycars.com
Password: Dealer123!@#

Email: buyer@autobuycars.com
Password: Buyer123!@#
```

**Setup semua akun test:**

```sql
-- Run di Supabase SQL Editor setelah user dibuat via Auth UI
INSERT INTO profiles (id, role, display_name, verified) VALUES
  ((SELECT id FROM auth.users WHERE email = 'admin@autobuycars.com'), 'admin', 'Administrator', true),
  ((SELECT id FROM auth.users WHERE email = 'dealer@autobuycars.com'), 'dealer', 'Dealer Demo', true),
  ((SELECT id FROM auth.users WHERE email = 'buyer@autobuycars.com'), 'buyer', 'Buyer Demo', true);
```

---

## Troubleshooting

### Error: "profiles table does not exist"
Buat table profiles dulu (lihat ROLES.md untuk schema lengkap):

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin', 'dealer', 'buyer', 'guest')),
  display_name TEXT,
  phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  dealer_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Admin tidak punya akses
Cek role di database:
```sql
SELECT u.email, p.role, p.verified 
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@autobuycars.com';
```

Harusnya return:
```
email                    | role  | verified
------------------------|-------|----------
admin@autobuycars.com   | admin | true
```

---

## Security Best Practices

1. ✅ Gunakan password kuat (min 12 karakter, mixed case, numbers, symbols)
2. ✅ Jangan commit credentials ke git
3. ✅ Gunakan environment variables untuk service keys
4. ✅ Enable 2FA untuk admin accounts (Supabase feature)
5. ✅ Rotate admin passwords regularly
6. ✅ Audit log untuk admin actions (coming soon)
