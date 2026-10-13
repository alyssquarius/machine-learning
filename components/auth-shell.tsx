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

export function AuthHero({ quote, name, role }: { quote: string; name?: string; role?: string }) {
  return (
    <div className="hidden p-3 md:block md:w-1/2 md:min-h-screen lg:w-1/2">
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        <Image
          src="/images/car-hero.jpg"
          alt="AutoBuyCars Hero"
          fill
          priority
          sizes="(max-width: 768px) 0vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white lg:p-14">
          <blockquote className="mb-6 text-xl font-medium leading-relaxed lg:text-2xl">
            &ldquo;{quote}&rdquo;
          </blockquote>
          {name ? (
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold">{name}</p>
                {role ? <p className="text-sm text-gray-300">{role}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AuthShell({
  children,
  title,
  subtitle,
  homeHref = "/login",
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row dark:bg-zinc-950">
      <div className="relative flex min-h-screen w-full flex-col bg-white p-8 md:w-1/2 lg:p-12 dark:bg-zinc-950 xl:p-20">
        <div className="mb-auto flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2 text-black dark:text-white">
            <CarLogo className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">AutoBuyCars</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">{title}</h1>
          <p className="mb-8 text-gray-500 dark:text-zinc-400">{subtitle}</p>
          {children}
        </div>
        <div className="mt-auto hidden md:block" />
      </div>
      <AuthHero
        quote="Temukan mobil impianmu dengan mudah dan cepat. AutoBuyCars memberikan pengalaman terbaik dalam jual beli mobil."
      />
    </div>
  );
}
