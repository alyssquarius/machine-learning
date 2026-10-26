"use client";

import * as React from "react";
import { useStore, type Car } from "@/components/store-provider";
import { DetailModal, ReceiptModal } from "@/components/modals";
import { HistText } from "@/components/hist-text";
import { useToast } from "@/components/toast";
import { timeAgo } from "@/lib/format";
import { HIST_OPTIONS, resolveHistFilterValue } from "@/lib/market";

const TONE: Record<string, string> = {
  beli: "bg-zinc-950 dark:bg-white",
  jual: "bg-zinc-500",
  tawar: "bg-zinc-400",
  favorit: "bg-zinc-400",
  status: "bg-zinc-500",
  verifikasi: "bg-zinc-300 dark:bg-zinc-600",
  batal: "bg-red-500",
  hapus: "bg-zinc-300 dark:bg-zinc-600",
};

function histLabel(id: string): string {
  const hit = HIST_OPTIONS.find((o) => o.id === id);
  return hit ? hit.label : "Semua aktivitas";
}

export default function RiwayatPage() {
  const store = useStore();
  const { toast } = useToast();
  const [filterRaw, setFilterRaw] = React.useState("Semua aktivitas");
  const [filter, setFilter] = React.useState("all");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [receiptCar, setReceiptCar] = React.useState<Car | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function onFilterChange(v: string) {
    setFilterRaw(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFilter(resolveHistFilterValue(v)), 250);
  }

  const total = store.history().length;
  const list = React.useMemo(() => {
    let out = store.history();
    const f = filter;
    if (f === "all") return out;
    if (f.startsWith("q:")) {
      const needle = f.slice(2).toLocaleLowerCase("id");
      if (needle) out = out.filter((h) => String(h.text || "").toLocaleLowerCase("id").includes(needle));
    } else if (f) {
      out = out.filter((h) => h.type === f);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cars, filter]);

  function exportCSV() {
    const csv = store.exportHistoryCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "riwayat-autobuycars.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Riwayat diunduh sebagai CSV.");
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
            Riwayat
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {total} aktivitas tercatat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Unduh CSV
          </button>
          <button
            onClick={() => {
              if (!total) return;
              if (!confirm("Hapus semua riwayat?")) return;
              store.clearHistory();
              toast("Riwayat dihapus.");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-400"
          >
            Hapus
          </button>
          <input
            value={filterRaw}
            onChange={(e) => onFilterChange(e.target.value)}
            list="hist-filter-list"
            type="text"
            placeholder="Ketik & pilih aktivitas..."
            autoComplete="off"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition appearance-none placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white"
          />
          <datalist id="hist-filter-list">
            {HIST_OPTIONS.map((o) => (
              <option key={o.id} value={o.label} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
            Belum ada riwayat pada filter ini.
          </p>
        ) : (
          <ul className="space-y-5">
            {list.map((h, i) => (
              <li key={h.id} className="relative flex gap-3">
                {i < list.length - 1 ? (
                  <span className="absolute -bottom-5 left-[5px] top-4 w-px bg-gray-200 dark:bg-zinc-800" aria-hidden="true" />
                ) : null}
                <span className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-zinc-900 ${TONE[h.type] || "bg-zinc-400"}`} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-gray-700 dark:text-zinc-300">
                    <HistText text={h.text} />
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{timeAgo(h.ts)}</span>
                    {h.carId ? (
                      <>
                        <span>•</span>
                        <button onClick={() => setDetailId(h.carId)} className="font-semibold underline underline-offset-2 hover:opacity-70 text-black dark:text-white">
                          Lihat detail mobil
                        </button>
                      </>
                    ) : null}
                    {h.type === "beli" && h.carId ? (() => {
                      const matched = store.get(h.carId);
                      if (!matched || !matched.purchase) return null;
                      return (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => setReceiptCar(matched)}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                          >
                            📄 Buka Nota Resmi
                          </button>
                        </>
                      );
                    })() : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {detailId ? (
        <DetailModal carId={detailId} onClose={() => setDetailId(null)} onBuy={() => {}} onOffer={() => {}} />
      ) : null}
      {receiptCar && receiptCar.purchase ? (
        <ReceiptModal car={receiptCar} purchase={receiptCar.purchase} onClose={() => setReceiptCar(null)} />
      ) : null}
      <p className="hidden">{histLabel(filter.startsWith("q:") ? "all" : filter)}</p>
    </div>
  );
}
