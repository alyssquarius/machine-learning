import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h2 className="text-xl font-bold text-black dark:text-white">
        Halaman tidak ditemukan
      </h2>
      <p className="mb-6 mt-2 text-sm text-gray-500 dark:text-zinc-400">
        Alamat yang kamu buka tidak tersedia.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
