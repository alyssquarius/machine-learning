"use client";

import * as React from "react";
import { CheckoutModal, DetailModal, OfferModal, SellModal } from "@/components/modals";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

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
      <PageHeader
        eyebrow="INVENTARIS & PENJUALAN"
        title="Jual Mobil"
        description="Kelola listing dan penawaran kendaraanmu."
        actions={
          <button onClick={onAdd} className="button-primary">
            <Icon name="plus" className="h-4 w-4" />
            Tambah listing baru
          </button>
        }
      />
      <div className="mb-6 inline-flex overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-zinc-800/80 max-w-full">
        {SELL_FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFilter(f.id)}
              aria-pressed={on}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                on
                  ? "bg-white text-black shadow-xs dark:bg-zinc-700 dark:text-white"
                  : "text-gray-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
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
