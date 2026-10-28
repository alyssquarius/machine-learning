import { getSupabaseConfig } from "@/lib/supabase/config";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function CarLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.28l1.08 3.11H5.77L6.85 7zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

export function AuthHero({ quote, name, role }: { quote?: string; name?: string; role?: string }) {
  return (
    <aside className="auth-hero">
      <Image
        src="/images/car-hero.jpg"
        alt="Kendaraan untuk perjalanan berikutnya"
        fill
        sizes="50vw"
        preload
        className="object-cover"
      />
      <div className="auth-hero-shade" />
      <div className="auth-hero-top">AutoBuyCars</div>
      <div className="auth-hero-copy">
        <h2>
          Pilih mobilnya.
          <br />
          Rencanakan anggarannya.
        </h2>
        <p>
          {quote ||
            "Simpan pilihan mobil, bandingkan spesifikasi, dan tanyakan detailnya kepada admin."}
        </p>
        <div className="auth-hero-bottom">
          <span>{name || "Katalog mobil & simulasi cicilan"}</span>
          <span>{role || "AutoBuyCars / Indonesia"}</span>
        </div>
      </div>
    </aside>
  );
}
export function AuthShell({
  children,
  title,
  subtitle,
  badge,
  homeHref = "/beli",
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  homeHref?: string;
}) {
  return (
    <div className="auth-layout">
      <section className="auth-main">
        <header className="flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-900 text-emerald-200">
              <CarLogo className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              AutoBuyCars<span className="text-emerald-600">.</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="auth-form-body">
          {badge ? <p className="eyebrow">{badge}</p> : null}
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          <div className="auth-form-frame">
            {getSupabaseConfig() ? (
              children
            ) : (
              <div role="status" className="space-y-4 text-sm">
                <p>Layanan akun sementara belum tersedia. Silakan coba lagi nanti.</p>
                <Link href="/beli" className="button-primary">
                  Jelajahi katalog mobil →
                </Link>
              </div>
            )}
          </div>
        </main>
        <footer className="mt-8 text-[10px] text-gray-400">
          © {new Date().getFullYear()} AutoBuyCars · Perjalanan berikutnya dimulai di sini.
        </footer>
      </section>
      <AuthHero />
    </div>
  );
}
