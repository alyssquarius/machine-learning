"use client";

import Link from "next/link";
import * as React from "react";
import { useStore } from "@/components/store-provider";
import { CarCard } from "@/components/car-card";
import { CheckoutModal, DetailModal, OfferModal } from "@/components/modals";
import { useToast } from "@/components/toast";

export default function FavoritPage() {
  const store = useStore();
  const { toast } = useToast();
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [buyId, setBuyId] = React.useState<string | null>(null);
  const list = store.favorites();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
            Favorit
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {list.length} mobil kamu simpan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {list.length > 0 ? (
            <button
              onClick={() => {
                if (!confirm(`Hapus ${list.length} favorit?`)) return;
                const n = store.clearFavs();
                toast(`${n} favorit dihapus.`);
              }}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-400"
            >
              Hapus Semua
            </button>
          ) : null}
          <Link
            href="/beli"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Cari Mobil
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-zinc-700">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
            <svg className="h-6 w-6 text-gray-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="font-semibold text-black dark:text-white">Belum ada favorit</p>
          <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Ketuk ikon hati pada mobil untuk menyimpannya di sini.
          </p>
          <Link
            href="/beli"
            className="inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Lihat Mobil
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <CarCard key={c.id} car={c} onDetail={setDetailId} onBuy={setBuyId} onOffer={setOfferId} />
          ))}
        </div>
      )}

      {detailId ? (
        <DetailModal carId={detailId} onClose={() => setDetailId(null)} onBuy={setBuyId} onOffer={setOfferId} />
      ) : null}
      {offerId ? <OfferModal carId={offerId} onClose={() => setOfferId(null)} /> : null}
      {buyId ? <CheckoutModal carId={buyId} onClose={() => setBuyId(null)} /> : null}
    </div>
  );
}
