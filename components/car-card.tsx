"use client";

import * as React from "react";
import { Icon } from "@/components/icons";
import { useStore, imageFor, type Car } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { fmtRp, timeAgo } from "@/lib/format";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export const STATUS_LABEL: Record<string, string> = {
  done: "Terjual",
  running: "Dijual",
  queued: "Menunggu",
  failed: "Ditolak",
};

const STATUS_CLS: Record<string, string> = {
  done: "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950",
  running: "bg-zinc-600 text-white",
  queued: "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white",
  failed:
    "border border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
};

function CarImage({ car, big = false }: { car: Car; big?: boolean }) {
  const fallback = imageFor(car.category);
  const [src, setSrc] = React.useState(car.image || fallback);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setSrc(car.image || fallback);
    setError(false);
  }, [car.image, car.category, fallback]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 dark:bg-zinc-800 ${big ? "h-64 sm:h-72" : "h-48"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={error ? fallback : src}
        alt={car.title}
        onError={() => setError(true)}
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
      />
      <div className="absolute right-3 top-3">
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[car.status] || STATUS_CLS.running}`}
        >
          {STATUS_LABEL[car.status] || "Dijual"}
        </span>
      </div>
    </div>
  );
}

export function CarCard({
  car,
  sell = false,
  onDetail,
  onEdit,
  onBuy,
  onOffer,
}: {
  car: Car;
  sell?: boolean;
  onDetail?: (id: string) => void;
  onEdit?: (id: string) => void;
  onBuy?: (id: string) => void;
  onOffer?: (id: string) => void;
}) {
  const store = useStore();
  const { toast } = useToast();
  const best = store.bestOffer(car.id);
  const isFav = store.isFav(car.id);

  function act(fn: () => void, msg: string) {
    fn();
    toast(msg);
  }

  return (
    <div className="car-card-hover animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className="relative cursor-pointer"
        onClick={() => onDetail?.(car.id)}
      >
        <CarImage car={car} />
        {!sell && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              act(
                () => store.toggleFav(car.id),
                isFav ? "Dihapus dari favorit." : "Disimpan ke favorit.",
              );
            }}
            title="Favorit"
            aria-label="Favorit"
            className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-97 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <svg
              className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : "fill-none text-current"}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3
            onClick={() => onDetail?.(car.id)}
            className="cursor-pointer line-clamp-1 font-bold text-black transition-colors hover:underline dark:text-white"
          >
            {car.title}
          </h3>
          <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-zinc-400">
            {car.year}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
          {car.km ? `${car.km.toLocaleString()} km` : "Km tidak tersedia"} •{" "}
          {car.location || "Indonesia"}
        </p>
        <p className="mt-2 text-lg font-bold text-black dark:text-white">
          {fmtRp(car.price)}
        </p>
        {best ? (
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tawaran tertinggi {fmtRp(best.amount)}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {car.interest || 0}% diminati<span>•</span>
          <span>{timeAgo(car.createdAt)}</span>
        </div>

        {/* Tombol Kontak WhatsApp langsung pada listing */}
        {!sell && (
          <div className="mt-3">
            <WhatsAppContact
              phoneNumber={car.sellerPhone || "6281234567890"}
              message={`Halo, saya tertarik dengan mobil ${car.title} seharga ${fmtRp(car.price)} di AutoBuyCars.`}
              className="w-full justify-center py-2 text-xs font-semibold"
            >
              Hubungi Penjual via WhatsApp
            </WhatsAppContact>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {sell ? (
            <>
              {car.status === "queued" ? (
                <button
                  onClick={() =>
                    act(
                      () => store.setStatus(car.id, "running"),
                      "Listing ditayangkan.",
                    )
                  }
                  className="flex-1 rounded-lg bg-black py-2 text-xs font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Tayangkan
                </button>
              ) : null}
              {car.status === "running" ? (
                <button
                  onClick={() =>
                    act(
                      () => store.setStatus(car.id, "done"),
                      "Ditandai terjual.",
                    )
                  }
                  className="flex-1 rounded-lg bg-black py-2 text-xs font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Tandai Terjual
                </button>
              ) : null}
              {car.status === "done" ? (
                <button
                  onClick={() =>
                    act(
                      () => store.setStatus(car.id, "running"),
                      "Listing ditayangkan lagi.",
                    )
                  }
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                >
                  Jual Lagi
                </button>
              ) : null}
              <button
                onClick={() => onEdit?.(car.id)}
                title="Edit"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                <Icon name="edit" className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  act(() => store.duplicate(car.id), "Listing diduplikat.")
                }
                title="Duplikat"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 8h10v12H8zM6 16V4h10"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus "${car.title}"?`))
                    act(() => store.remove(car.id), "Listing dihapus.");
                }}
                title="Hapus"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-600 active:scale-97 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-400"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {car.status === "running" ? (
                <button
                  onClick={() => onBuy?.(car.id)}
                  className="flex-1 rounded-lg bg-black py-2 text-xs font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Beli Sekarang
                </button>
              ) : null}
              <button
                onClick={() => onDetail?.(car.id)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                Detail
              </button>
            </>
          )}
        </div>
        {!sell && car.status === "running" ? (
          <button
            onClick={() => onOffer?.(car.id)}
            className="mt-2 w-full rounded-lg border border-gray-300 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Ajukan Tawaran
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-zinc-700">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
        <svg
          className="h-6 w-6 text-gray-400 dark:text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>
      <p className="font-semibold text-black dark:text-white">{title}</p>
      <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {subtitle}
      </p>
      {action}
    </div>
  );
}
