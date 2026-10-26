-- ============================================
-- 1. Buat tabel profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'dealer', 'buyer')),
  display_name text,
  avatar_url text,
  verified boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- RLS: aktifkan Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user bisa baca profil sendiri
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: user bisa update profil sendiri
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: user bisa insert profil sendiri
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. Buat bucket "avatars" (public)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policy: siapa saja bisa lihat avatar (public read)
CREATE POLICY "Avatar public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Policy: user hanya bisa upload ke folder miliknya sendiri
CREATE POLICY "Avatar upload own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: user hanya bisa update file di folder miliknya
CREATE POLICY "Avatar update own folder"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: user hanya bisa hapus file di folder miliknya
CREATE POLICY "Avatar delete own folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
