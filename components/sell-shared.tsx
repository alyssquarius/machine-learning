"use client";

import * as React from "react";
import { CheckoutModal, DetailModal, OfferModal, SellModal } from "@/components/modals";

const SELL_FILTERS = [
  { id: "all", label: "Semua" },
  { id: "running", label: "Dijual" },
  { id: "queued", label: "Menunggu" },
  { id: "done", label: "Terjual" },
  { id: "failed", label: "Ditolak" },
];

export function SellToolbar({
  filter,
  onFilter,
  onAdd,
}: {
  filter: string;
  onFilter: (f: string) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
            Jual Mobil
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Pasang listing baru dan kelola status penjualanmu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Listing
          </button>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {SELL_FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFilter(f.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                on
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function useModals() {
  const [sellOpen, setSellOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [buyId, setBuyId] = React.useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setSellOpen(true);
  }
  function openEdit(id: string) {
    setEditingId(id);
    setSellOpen(true);
  }
  function openDetail(id: string) {
    setDetailId(id);
  }

  const modals = (
    <>
      {sellOpen ? (
        <SellModal
          editingId={editingId}
          onClose={() => {
            setSellOpen(false);
            setEditingId(null);
          }}
        />
      ) : null}
      {detailId ? (
        <DetailModal
          carId={detailId}
          onClose={() => setDetailId(null)}
          onBuy={(id) => setBuyId(id)}
          onOffer={(id) => setOfferId(id)}
        />
      ) : null}
      {offerId ? <OfferModal carId={offerId} onClose={() => setOfferId(null)} /> : null}
      {buyId ? <CheckoutModal carId={buyId} onClose={() => setBuyId(null)} /> : null}
    </>
  );

  return { openAdd, openEdit, openDetail, modals, setBuyId, setOfferId };
}
