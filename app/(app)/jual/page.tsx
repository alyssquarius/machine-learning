"use client";

import * as React from "react";
import Link from "next/link";
import { CarCard } from "@/components/car-card";
import { SellToolbar, useModals } from "@/components/sell-shared";
import { useStore } from "@/components/store-provider";
import { useRole } from "@/components/role-provider";
import { WhatsAppContact } from "@/components/whatsapp-contact";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { config } from "@/lib/config";

export default function JualPage() {
  const { role, permissions, authChecked } = useRole();
  const store = useStore();
  const [filter, setFilter] = React.useState("all");
  const { openAdd, openEdit, openDetail, modals, setBuyId, setOfferId } = useModals();
  const s = store.stats();
  const list = store.inventory().filter((c) => filter === "all" || c.status === filter);

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-zinc-700 dark:border-t-white" />
      </div>
    );
  }

  // Batasan role: hanya admin yang bisa menjual mobil
  if (!permissions.canCreateListing) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center animate-fade-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
          Akses Khusus Dealer & Penjual
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
          {role === "guest"
            ? "Anda belum login. Silakan masuk atau mendaftar sebagai Dealer untuk dapat mengunggah dan mengelola listing mobil."
            : "Akun Anda saat ini memiliki peran Pembeli (Buyer). Fitur memasang listing mobil khusus untuk Dealer dan Administrator."}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/beli"
            className="w-full rounded-lg bg-black px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 sm:w-auto dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Lihat Katalog Mobil
          </Link>
          <WhatsAppContact
            phoneNumber={config.whatsapp.phoneNumber}
            message={`Halo Admin AutoBuyCars, saya ingin mendaftar dan memverifikasi akun saya sebagai Dealer mobil.`}
            className="w-full justify-center px-5 py-2.5 text-sm font-semibold sm:w-auto"
          >
            Daftar Menjadi Dealer
          </WhatsAppContact>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Listing", value: s.total },
    { label: "Aktif Dijual", value: s.active },
    { label: "Menunggu", value: s.pending },
    { label: "Terjual", value: s.sold },
  ];

  return (
    <div>
      <SellToolbar filter={filter} onFilter={setFilter} onAdd={openAdd} />
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {stats.map((t) => (
          <div
            key={t.label}
            className="surface p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              {t.label}
            </p>
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-black dark:text-white">
              {t.value}
            </p>
          </div>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="surface"><EmptyState icon="tag" title="Listing pertamamu, peluang berikutnya." description="Tambahkan informasi mobil dan foto terbaiknya. Listing yang ditayangkan akan muncul di katalog browser ini."><button onClick={openAdd} className="button-primary"><Icon name="plus" className="h-4 w-4" />Tambahkan mobil</button></EmptyState></div>
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
