"use client";

import Image from "next/image";
import * as React from "react";
import { CATEGORIES, CITY_GROUPS, INDONESIA_CITIES } from "@/lib/cities";
import { useStore, type Car } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { fmtRp, timeAgo } from "@/lib/format";
import { checkoutCalc, TENORS } from "@/lib/market";
import { STATUS_LABEL } from "@/components/car-card";
import { WhatsAppContact } from "@/components/whatsapp-contact";

function ModalShell({
  onClose,
  children,
  wide = false,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl animate-zoom-in dark:border-zinc-800 dark:bg-zinc-950 ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 animate-fade-in dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
      {msg}
    </p>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white";
const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300";

// ---------- Modal Jual (tambah / edit) ----------

export function SellModal({
  editingId,
  onClose,
}: {
  editingId: string | null;
  onClose: (saved?: boolean) => void;
}) {
  const store = useStore();
  const { toast } = useToast();
  const editing = editingId ? store.get(editingId) : undefined;
  const [err, setErr] = React.useState("");
  const [priceDisplay, setPriceDisplay] = React.useState(editing?.price?.toLocaleString("id-ID") || "");
  const [kmDisplay, setKmDisplay] = React.useState(editing?.km?.toLocaleString("id-ID") || "");
  const [sellerPhone, setSellerPhone] = React.useState(editing?.sellerPhone || "");
  const maxYear = new Date().getFullYear();

  function formatNumber(val: string): string {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num, 10).toLocaleString("id-ID") : "";
  }

  function parseNumber(val: string): number {
    return parseInt(val.replace(/\D/g, "") || "0", 10);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const price = parseNumber(priceDisplay);
    const year = Number(fd.get("year") || 0);
    const km = parseNumber(kmDisplay);
    const location = String(fd.get("location") || "").trim();
    const category = String(fd.get("category") || "SUV");
    const image = String(fd.get("image") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const phone = String(fd.get("sellerPhone") || "").trim();

    if (title.length < 4) return setErr("Judul minimal 4 karakter.");
    if (!price || price < 1000000) return setErr("Harga minimal Rp 1.000.000.");
    if (!year || year < 1990 || year > maxYear) return setErr(`Tahun harus 1990–${maxYear}.`);
    if (!location) return setErr("Kota wajib diisi.");
    if (!phone || phone.replace(/\D/g, "").length < 9) return setErr("Nomor WhatsApp penjual wajib diisi (minimal 9 digit).");

    setErr("");
    if (editing) {
      const ok = store.edit(editing.id, { title, price, year, km, location, category, image, description, sellerPhone: phone });
      if (!ok) return setErr("Gagal menyimpan. Periksa kembali isian.");
      toast("Listing diperbarui.");
    } else {
      store.add({ title, price, year, km, location, category, image, description, sellerPhone: phone });
      toast("Listing ditambahkan, menunggu verifikasi.");
    }
    onClose(true);
  }

  return (
    <ModalShell onClose={() => onClose()} wide>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">
            {editing ? "Edit Listing" : "Tambah Listing"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {editing ? "Perbarui data mobilmu." : 'Listing baru masuk sebagai "Menunggu" verifikasi.'}
          </p>
        </div>
        <button onClick={() => onClose()} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800">
          ✕
        </button>
      </div>
      <FieldError msg={err} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Judul Mobil *</label>
          <input name="title" defaultValue={editing?.title || ""} placeholder="cth: Toyota Avanza 1.5 G CVT" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Harga (Rp) *</label>
            <input
              type="text"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(formatNumber(e.target.value))}
              placeholder="250.000.000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tahun *</label>
            <input name="year" type="number" min={1990} max={maxYear} defaultValue={editing?.year || ""} placeholder="2022" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>KM</label>
            <input
              type="text"
              value={kmDisplay}
              onChange={(e) => setKmDisplay(formatNumber(e.target.value))}
              placeholder="25.000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kota *</label>
            <input name="location" list="sell-location-list" defaultValue={editing?.location || ""} placeholder="Ketik & pilih kota..." autoComplete="off" className={inputCls} />
            <datalist id="sell-location-list">
              {Object.entries(CITY_GROUPS).map(([prov, cities]) => (
                <optgroup key={prov} label={prov}>
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </optgroup>
              ))}
              {INDONESIA_CITIES.filter((c) => !Object.values(CITY_GROUPS).flat().includes(c)).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Kategori</label>
            <select name="category" defaultValue={editing?.category || "SUV"} className={`${inputCls} appearance-none`}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nomor WhatsApp Penjual *</label>
            <input
              name="sellerPhone"
              type="text"
              value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value)}
              placeholder="cth: 081234567890"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>URL Foto (opsional)</label>
          <input name="image" defaultValue={editing?.image || ""} placeholder="https://..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Deskripsi</label>
          <textarea name="description" rows={3} defaultValue={editing?.description || ""} placeholder="Kondisi, servis, pajak..." className={inputCls} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => onClose()} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            {editing ? "Simpan Perubahan" : "Pasang Listing"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------- Modal Detail ----------

export function DetailModal({
  carId,
  onClose,
  onBuy,
  onOffer,
}: {
  carId: string;
  onClose: () => void;
  onBuy: (id: string) => void;
  onOffer: (id: string) => void;
}) {
  const store = useStore();
  const { toast } = useToast();
  const car = store.get(carId);
  if (!car) return null;
  const c = car;
  const on = store.isFav(c.id);
  const offers = store.offersFor(c.id);

  return (
    <ModalShell onClose={onClose} wide>
      <Image
        src={c.image || "/images/car-hero.jpg"}
        alt={c.title}
        width={800}
        height={450}
        sizes="(max-width: 640px) 100vw, 512px"
        unoptimized
        className="h-44 w-full rounded-lg object-cover"
      />
      <div className="p-1 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-950">
              {STATUS_LABEL[c.status] || c.status}
            </span>
            <h3 className="mt-2 text-xl font-bold text-black dark:text-white">{c.title}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {c.year} • {c.km.toLocaleString("id-ID")} km • {c.location} • {c.category}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800">
            ✕
          </button>
        </div>
        <p className="mt-3 text-2xl font-bold text-black dark:text-white">{fmtRp(c.price)}</p>
        {c.description ? (
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{c.description}</p>
        ) : null}
        {c.purchase ? (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {c.purchase.method === "kredit" ? (
              <p>
                Dibeli kredit — DP {fmtRp(c.purchase.dp)} • {c.purchase.tenor}× {fmtRp(c.purchase.installment)}/bln • bunga {Number(c.purchase.rate) || 0}%/thn
                {c.purchase.name ? ` • ${c.purchase.name}` : ""}
              </p>
            ) : c.purchase.method === "tawar" ? (
              <p>
                Terjual via tawaran {fmtRp(c.price)}
                {c.purchase.name ? ` • ${c.purchase.name}` : ""}
              </p>
            ) : (
              <p>
                Dibeli tunai {fmtRp(c.price)}
                {c.purchase.name ? ` • ${c.purchase.name}` : ""}
              </p>
            )}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
          <span>{c.interest || 0}% diminati</span>
          <span>•</span>
          <span>Ditambahkan {timeAgo(c.createdAt)}</span>
        </div>
        <div className="mt-5 flex gap-2">
          {c.status === "running" ? (
            <button
              onClick={() => {
                onClose();
                onBuy(c.id);
              }}
              className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Beli Sekarang
            </button>
          ) : null}
          <button
            onClick={() => {
              store.toggleFav(c.id);
              toast(on ? "Dihapus dari favorit." : "Ditambahkan ke favorit.");
            }}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition active:scale-97 ${
              on
                ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            }`}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {on ? "Favorit" : "Simpan Favorit"}
          </button>
        </div>
        {c.status !== "done" ? (
          <button
            onClick={() => {
              onClose();
              onOffer(c.id);
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Ajukan Tawaran
          </button>
        ) : null}
        <div className="mt-2">
          <WhatsAppContact
            phoneNumber={c.sellerPhone || "6281234567890"}
            message={`Halo, saya tertarik dengan mobil ${c.title} seharga ${fmtRp(c.price)} di AutoBuyCars.`}
            className="w-full justify-center py-2.5 text-sm font-semibold"
          >
            Hubungi Penjual via WhatsApp
          </WhatsAppContact>
        </div>
        {offers.length > 0 ? (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-bold text-black dark:text-white">Tawaran ({offers.length})</h4>
            <ul className="space-y-2">
              {offers.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-zinc-800">
                  <div className="min-w-0">
                    <p className="font-semibold text-black dark:text-white">{fmtRp(o.amount)}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-zinc-400">
                      {o.note || "—"} • {timeAgo(o.ts)} • {o.status}
                    </p>
                  </div>
                  {o.status === "pending" ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => {
                          store.decideOffer(c.id, o.id, true);
                          toast("Tawaran diterima, mobil terjual.");
                          onClose();
                        }}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white active:scale-97 dark:bg-white dark:text-zinc-950"
                      >
                        Terima
                      </button>
                      <button
                        onClick={() => {
                          store.decideOffer(c.id, o.id, false);
                          toast("Tawaran ditolak.");
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold active:scale-97 dark:border-zinc-700"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

// ---------- Modal Tawar ----------

export function OfferModal({ carId, onClose }: { carId: string; onClose: () => void }) {
  const store = useStore();
  const { toast } = useToast();
  const car = store.get(carId);
  const [err, setErr] = React.useState("");
  const [amountDisplay, setAmountDisplay] = React.useState("");

  if (!car) return null;

  function formatNumber(val: string): string {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num, 10).toLocaleString("id-ID") : "";
  }
  function parseNumber(val: string): number {
    return parseInt(val.replace(/\D/g, "") || "0", 10);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseNumber(amountDisplay);
    const note = String(fd.get("note") || "").trim();

    if (!amount || amount < 1000000) return setErr("Tawaran minimal Rp 1.000.000.");
    setErr("");
    store.makeOffer(carId, amount, note);
    toast("Penawaran berhasil dikirim ke penjual.");
    onClose();
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-black dark:text-white">Ajukan Tawaran Harga</h3>
        <button onClick={onClose} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800">
          ✕
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-500 dark:text-zinc-400">
        Mobil: <span className="font-semibold text-black dark:text-white">{car.title}</span> (Harga: {fmtRp(car.price)})
      </p>
      <FieldError msg={err} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Jumlah Tawaran (Rp) *</label>
          <input
            type="text"
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(formatNumber(e.target.value))}
            placeholder="cth: 230.000.000"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Catatan / Pesan untuk Penjual</label>
          <input name="note" placeholder="cth: Hubungi saya jika deal" className={inputCls} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Kirim Tawaran
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------- Modal Checkout (Beli) ----------

export function CheckoutModal({ carId, onClose }: { carId: string; onClose: () => void }) {
  const store = useStore();
  const { toast } = useToast();
  const car = store.get(carId);
  const [method, setMethod] = React.useState<"tunai" | "kredit">("tunai");
  const [dpPct, setDpPct] = React.useState(30);
  const [tenor, setTenor] = React.useState(36);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState("");

  if (!car) return null;
  const c = car;

  const calc = checkoutCalc(c.price, dpPct, tenor, 8);

  function onCheckout() {
    if (!name.trim()) return setErr("Nama lengkap wajib diisi.");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) return setErr("Nomor WhatsApp/Telepon wajib diisi.");
    setErr("");
    const ok = store.buy(c.id, {
      method,
      dp: calc.dp,
      tenor,
      rate: 8,
      installment: calc.installment,
      name: name.trim(),
      phone: phone.trim(),
    });
    if (!ok) return setErr("Gagal melakukan pembelian.");
    toast(method === "kredit" ? "Pengajuan kredit berhasil dikirim." : "Pembelian tunai berhasil.");
    onClose();
  }

  return (
    <ModalShell onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-black dark:text-white">Pembelian Mobil</h3>
        <button onClick={onClose} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800">
          ✕
        </button>
      </div>
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-bold text-black dark:text-white">{car.title}</p>
        <p className="mt-0.5 text-lg font-semibold text-black dark:text-white">{fmtRp(car.price)}</p>
      </div>
      <FieldError msg={err} />
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("tunai")}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition active:scale-97 ${
                method === "tunai"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              }`}
            >
              Tunai (Cash)
            </button>
            <button
              type="button"
              onClick={() => setMethod("kredit")}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition active:scale-97 ${
                method === "kredit"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              }`}
            >
              Kredit (Cicilan)
            </button>
          </div>
        </div>

        {method === "kredit" && (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
            <div>
              <label className={labelCls}>Uang Muka (DP): {dpPct}% ({fmtRp(calc.dp)})</label>
              <div className="flex gap-2">
                {[20, 30, 40, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDpPct(p)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition active:scale-97 ${
                      dpPct === p
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Tenor (Bulan)</label>
              <div className="grid grid-cols-4 gap-2">
                {TENORS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTenor(t)}
                    className={`rounded-lg border py-1.5 text-xs font-semibold transition active:scale-97 ${
                      tenor === t
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    {t} bln
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-zinc-900">
              <p className="font-semibold text-black dark:text-white">Estimasi Cicilan:</p>
              <p className="mt-1 text-lg font-bold text-black dark:text-white">{fmtRp(calc.installment)} / bulan</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Bunga 8% / tahun • Pokok hutang {fmtRp(calc.principal)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Lengkap *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Budi Santoso" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>No. WhatsApp / Telepon *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="cth: 081234567890" className={inputCls} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="button" onClick={onCheckout} className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            {method === "kredit" ? "Ajukan Kredit" : "Konfirmasi Pembelian"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
