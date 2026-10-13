"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl font-bold text-black dark:text-white">
        Terjadi kesalahan
      </h2>
      <p className="mx-auto mb-6 mt-2 max-w-sm text-sm text-gray-500 dark:text-zinc-400">
        {error.message || "Coba muat ulang halaman."}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Coba lagi
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
        >
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
