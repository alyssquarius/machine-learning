# AutoBuyCars

Platform jual beli mobil — Next.js 16 App Router + Tailwind CSS v4 + Supabase Auth.

## Jalan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` (redirect ke `/login`).

Butuh env Supabase di `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build

```bash
npx tsc --noEmit
npx next build --webpack
```

Catatan: `npm run build` bawaan (Turbopack Next 16.4.0) gagal di
`@vercel/turbopack-next/internal/font/google/font` — bug toolchain,
bukan kode aplikasi. Build webpack lolos penuh (13 route static).

## Struktur

- `app/` — App Router: `(app)/dashboard|jual|beli|favorit|riwayat|pengaturan`, `(auth)/login|register|forgot-password|reset-password`, `loading/error/not-found`
- `components/` — `app-shell`, `auth-shell`, `car-card`, `dashboard-widgets`, `hist-text`, `modals`, `sell-shared`, `store-provider`, `theme-*`, `toast`, `icons`
- `lib/` — `cities` (kota se-Indonesia), `market` (widget/checkout/filter), `format`, `supabase/client|server|middleware`
- `proxy.ts` — session Supabase (Next.js 16)
- `app/globals.css` — satu-satunya global CSS (Tailwind murni)

## Konvensi UI

Semua halaman fitur mengikuti pola header Riwayat:

- Judul `text-2xl sm:text-3xl font-bold tracking-tight`
- Subjudul `mt-1 text-sm text-gray-500 dark:text-zinc-400`
- Bar aksi `flex flex-wrap gap-2`, tombol `px-4 py-2 text-sm font-semibold rounded-lg`
- Gambar via `next/image`, teks riwayat via `HistText` (tanpa `dangerouslySetInnerHTML`)
