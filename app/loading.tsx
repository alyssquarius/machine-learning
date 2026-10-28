export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat halaman"
      className="animate-pulse space-y-6 p-6"
    >
      <div className="h-4 w-24 rounded bg-emerald-100 dark:bg-zinc-800" />
      <div className="h-7 w-56 rounded-lg bg-gray-200 dark:bg-zinc-800" />
      <div className="h-44 rounded-2xl bg-gray-100 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-zinc-800" />
        ))}
      </div>
      <span className="sr-only">Menyiapkan halaman...</span>
    </div>
  );
}
