export default function Loading() {
  return (
    <div className="py-16 text-center" aria-busy="true" aria-live="polite">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-zinc-700 dark:border-t-white" />
      <p className="text-sm text-gray-500 dark:text-zinc-400">Memuat...</p>
    </div>
  );
}
