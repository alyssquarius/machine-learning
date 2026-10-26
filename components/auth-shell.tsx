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

export function AuthHero({
  quote = "Temukan mobil impianmu dengan mudah dan cepat. AutoBuyCars memberikan pengalaman terbaik dalam jual beli mobil.",
  name,
  role,
}: {
  quote?: string;
  name?: string;
  role?: string;
}) {
  return (
    <div className="hidden p-4 md:block md:w-1/2 md:min-h-screen lg:w-1/2">
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        <Image
          src="/images/car-hero.jpg"
          alt="AutoBuyCars Luxury Showcase"
          fill
          priority
          sizes="(max-width: 768px) 0vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
        />
        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Floating Glass Pill 1: Top Right */}
        <div className="animate-float-slow absolute top-8 right-8 z-10 hidden sm:block">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/45 p-3.5 backdrop-blur-xl shadow-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">1.200+ Unit Terverifikasi</p>
              <p className="text-[11px] text-zinc-300">160 Titik Inspeksi Ketat</p>
            </div>
          </div>
        </div>

        {/* Floating Glass Pill 2: Left Middle */}
        <div className="animate-float-delay absolute top-40 left-8 z-10 hidden lg:block">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/45 p-3.5 backdrop-blur-xl shadow-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">Garansi Mesin & Transmisi</p>
              <p className="text-[11px] text-zinc-300">Jaminan Keaslian BPKB & STNK</p>
            </div>
          </div>
        </div>

        {/* Bottom Hero Narrative */}
        <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 lg:p-16 text-white z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pasar Mobil Digital Indonesia</span>
          </div>

          <blockquote className="mb-6 text-xl font-medium leading-relaxed tracking-tight lg:text-2xl text-zinc-100">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {name ? (
            <div className="flex items-center gap-3 border-t border-white/15 pt-4">
              <div>
                <p className="font-semibold text-white">{name}</p>
                {role ? <p className="text-xs text-zinc-400">{role}</p> : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 border-t border-white/15 pt-4 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Tanpa Biaya Tersembunyi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Inspeksi Bebas Banjir</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthShell({
  children,
  title,
  subtitle,
  badge,
  homeHref = "/login",
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row dark:bg-zinc-950 auth-glow-bg">
      <div className="relative flex min-h-screen w-full flex-col p-6 sm:p-10 md:w-1/2 lg:p-12 xl:p-16">
        {/* Top Header */}
        <div className="mb-auto flex items-center justify-between">
          <Link
            href={homeHref}
            className="group flex items-center gap-2.5 text-black transition-opacity hover:opacity-85 dark:text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-sm dark:bg-white dark:text-black">
              <CarLogo className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">AutoBuyCars</span>
              <span className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase block -mt-1 dark:text-zinc-400">
                Official Marketplace
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Form Body with Smooth Entrance */}
        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="animate-page-enter">
            {badge ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{badge}</span>
              </div>
            ) : null}

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white">
              {title}
            </h1>
            <p className="mt-1.5 mb-6 text-sm text-gray-500 leading-relaxed dark:text-zinc-400">
              {subtitle}
            </p>

            <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-6 sm:p-8 backdrop-blur-md shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/70">
              {children}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-6 text-center text-xs text-gray-400 dark:text-zinc-500">
          &copy; 2026 AutoBuyCars • Sistem Otomotif Terverifikasi
        </div>
      </div>

      <AuthHero />
    </div>
  );
}
