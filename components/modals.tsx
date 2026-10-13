"use client";

import Image from "next/image";
import * as React from "react";
import { CATEGORIES, CITY_GROUPS, INDONESIA_CITIES } from "@/lib/cities";
import { useStore, type Car } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { fmtRp, timeAgo } from "@/lib/format";
import { checkoutCalc, TENORS } from "@/lib/market";
import { STATUS_LABEL } from "@/components/car-card";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 ${
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
    <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
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
  const maxYear = new Date().getFullYear();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const price = Number(fd.get("price") || 0);
    const year = Number(fd.get("year") || 0);
    const km = Number(fd.get("km") || 0);
    const location = String(fd.get("location") || "").trim();
    const category = String(fd.get("category") || "SUV");
    const image = String(fd.get("image") || "").trim();
    const description = String(fd.get("description") || "").trim();

    if (title.length < 4) return setErr("Judul minimal 4 karakter.");
    if (!price || price < 1000000) return setErr("Harga minimal Rp 1.000.000.");
    if (!year || year < 1990 || year > maxYear) return setErr(`Tahun harus 1990–${maxYear}.`);
    if (!location) return setErr("Kota wajib diisi.");

    setErr("");
    if (editing) {
      const ok = store.edit(editing.id, { title, price, year, km, location, category, image, description });
      if (!ok) return setErr("Gagal menyimpan. Periksa kembali isian.");
      toast("Listing diperbarui.");
    } else {
      store.add({ title, price, year, km, location, category, image, description });
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
        <button onClick={() => onClose()} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
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
            <input name="price" type="number" min={1000000} defaultValue={editing?.price || ""} placeholder="250000000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tahun *</label>
            <input name="year" type="number" min={1990} max={maxYear} defaultValue={editing?.year || ""} placeholder="2022" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>KM</label>
            <input name="km" type="number" min={0} defaultValue={editing?.km || ""} placeholder="25000" className={inputCls} />
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
            <label className={labelCls}>URL Foto (opsional)</label>
            <input name="image" defaultValue={editing?.image || ""} placeholder="https://..." className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Deskripsi</label>
          <textarea name="description" rows={3} defaultValue={editing?.description || ""} placeholder="Kondisi, servis, pajak..." className={inputCls} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => onClose()} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
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
          <button onClick={onClose} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
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
              className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Beli Sekarang
            </button>
          ) : null}
          <button
            onClick={() => {
              store.toggleFav(c.id);
              toast(on ? "Dihapus dari favorit." : "Ditambahkan ke favorit.");
            }}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
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
            className="mt-2 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Ajukan Tawaran
          </button>
        ) : null}
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
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950"
                      >
                        Terima
                      </button>
                      <button
                        onClick={() => {
                          store.decideOffer(c.id, o.id, false);
                          toast("Tawaran ditolak.");
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-zinc-700"
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
  if (!car) return null;
  const c = car;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount") || 0);
    const note = String(fd.get("note") || "");
    if (!amount || amount < 1000000) return setErr("Tawaran minimal Rp 1.000.000.");
    const ok = store.makeOffer(c.id, amount, note);
    if (!ok) return setErr("Gagal mengirim tawaran. Mobil mungkin sudah terjual.");
    toast("Tawaran terkirim.");
    onClose();
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">Ajukan Tawaran</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{c.title} — {fmtRp(c.price)}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
          ✕
        </button>
      </div>
      <FieldError msg={err} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Harga tawaran (Rp) *</label>
          <input name="amount" type="number" min={1000000} placeholder="cth: 450000000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Catatan (opsional)</label>
          <textarea name="note" rows={2} maxLength={140} placeholder="cth: bayar tunai minggu ini" className={inputCls} />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Kirim Tawaran
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ---------- Modal Checkout ----------

export function CheckoutModal({ carId, onClose }: { carId: string; onClose: (done?: boolean) => void }) {
  const store = useStore();
  const { toast } = useToast();
  const car = store.get(carId);
  const [method, setMethod] = React.useState<"tunai" | "kredit">("tunai");
  const [tenor, setTenor] = React.useState(36);
  const [dp, setDp] = React.useState("");
  const [rate, setRate] = React.useState("8");
  const [err, setErr] = React.useState("");
  if (!car) return null;
  const c = car;
  const price = Number(c.price) || 0;
  const dpNum = Math.max(0, Number(dp) || 0);
  const rateNum = Math.max(0, Math.min(30, Number(rate) || 0));
  const sim = checkoutCalc(price, dpNum, tenor, rateNum);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").replace(/[^\d]/g, "");
    if (name.length < 3) return setErr("Nama pembeli minimal 3 karakter.");
    if (phone.length < 9) return setErr("Nomor HP minimal 9 digit.");
    if (method === "kredit") {
      if (dpNum < Math.round(price * 0.1)) return setErr(`DP minimal 10% (${fmtRp(Math.round(price * 0.1))}).`);
      if (dpNum >= price) return setErr("DP harus lebih kecil dari harga mobil.");
    }
    setErr("");
    const payload =
      method === "kredit"
        ? { method: "kredit" as const, name, phone, dp: dpNum, tenor, rate: rateNum, installment: sim.monthly }
        : { method: "tunai" as const, name, phone };
    const ok = store.buy(c.id, payload);
    if (!ok) return setErr("Gagal memproses. Mobil mungkin sudah terjual.");
    toast(
      method === "kredit"
        ? `Pembelian kredit berhasil! Cicilan ${fmtRp(sim.monthly)}/bln × ${tenor} bln.`
        : "Pembelian tunai berhasil!"
    );
    onClose(true);
  }

  const payBtn = (on: boolean) =>
    `rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${on ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"}`;

  return (
    <ModalShell onClose={() => onClose()} wide>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">Checkout Pembelian</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{c.title} — {fmtRp(price)}</p>
        </div>
        <button onClick={() => onClose()} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
          ✕
        </button>
      </div>
      <FieldError msg={err} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama pembeli *</label>
            <input name="name" placeholder="Nama lengkap" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>No. HP *</label>
            <input name="phone" type="tel" inputMode="tel" placeholder="08xx" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Metode pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMethod("tunai")} className={payBtn(method === "tunai")}>
              Tunai
            </button>
            <button type="button" onClick={() => setMethod("kredit")} className={payBtn(method === "kredit")}>
              Kredit / Cicilan
            </button>
          </div>
        </div>
        {method === "kredit" ? (
          <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>DP (Rp)</label>
                <input type="number" min={0} value={dp} onChange={(e) => setDp(e.target.value)} placeholder="cth: 100000000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bunga / tahun (%)</label>
                <input type="number" min={0} max={30} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tenor</label>
              <div className="flex flex-wrap gap-2">
                {TENORS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTenor(t)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${tenor === t ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-gray-300 text-gray-600 hover:text-black dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"}`}
                  >
                    {t} bln
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-1 text-xs text-gray-500 dark:text-zinc-400">Estimasi cicilan per bulan</p>
              <p className="text-xl font-bold text-black dark:text-white">{fmtRp(sim.monthly)}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                Pinjaman {fmtRp(sim.principal)} • tenor {tenor} bln • bunga {rateNum}%/thn • total bayar {fmtRp(sim.total + dpNum)}
              </p>
            </div>
          </div>
        ) : null}
        <div className="break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <b className="text-black dark:text-white">{c.title}</b> — harga {fmtRp(price)}
          {method === "kredit" ? `, DP ${fmtRp(dpNum)}, sisa ${fmtRp(sim.principal)}, cicilan ${fmtRp(sim.monthly)}/bln × ${tenor} bln.` : ", bayar tunai penuh."}
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => onClose()} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button type="submit" className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Bayar Sekarang
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
