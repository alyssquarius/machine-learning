"use client";

import * as React from "react";
import { CarCard } from "@/components/car-card";
import { SellToolbar, useModals } from "@/components/sell-shared";
import { useStore } from "@/components/store-provider";

export default function JualPage() {
  const store = useStore();
  const [filter, setFilter] = React.useState("all");
  const { openAdd, openEdit, openDetail, modals, setBuyId, setOfferId } = useModals();
  const s = store.stats();
  const list = store.all().filter((c) => filter === "all" || c.status === filter);

  const stats = [
    { label: "Total Listing", value: s.total },
    { label: "Aktif Dijual", value: s.active },
    { label: "Menunggu", value: s.pending },
    { label: "Terjual", value: s.sold },
  ];

  return (
    <div>
      <SellToolbar filter={filter} onFilter={setFilter} onAdd={openAdd} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((t) => (
          <div key={t.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">{t.label}</p>
            <p className="mt-1 text-2xl font-bold text-black dark:text-white">{t.value}</p>
          </div>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-zinc-400">
          Belum ada listing pada filter ini.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <CarCard
              key={c.id}
              car={c}
              sell
              onDetail={openDetail}
              onBuy={setBuyId}
              onOffer={setOfferId}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}
      {modals}
    </div>
  );
}
