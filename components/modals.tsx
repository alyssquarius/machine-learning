"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CATEGORIES, CITY_GROUPS, INDONESIA_CITIES } from "@/lib/cities";
import { useStore, type Car, type CarStatus, type Purchase } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { useRole } from "@/components/role-provider";
import { fmtRp, timeAgo } from "@/lib/format";
import { checkoutCalc, TENORS } from "@/lib/market";
import { STATUS_LABEL } from "@/components/car-card";
import { WhatsAppContact } from "@/components/whatsapp-contact";
import { CarImageUpload } from "@/components/car-image-upload";
import { ReceiptModal } from "@/components/invoice-modal";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-black/10 bg-white/95 p-6 shadow-2xl backdrop-blur-xl animate-zoom-in dark:border-white/10 dark:bg-zinc-900/95 ${
          wide ? "max-w-xl" : "max-w-md"
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
  const [carImage, setCarImage] = React.useState(editing?.image || "");
  const [listingStatus, setListingStatus] = React.useState<CarStatus>(editing?.status || "running");
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
    const image = carImage.trim() || String(fd.get("image") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const phone = String(fd.get("sellerPhone") || "").trim();

    if (title.length < 4) return setErr("Judul minimal 4 karakter.");
    if (!price || price < 1000000) return setErr("Harga minimal Rp 1.000.000.");
    if (!year || year < 1990 || year > maxYear) return setErr(`Tahun harus 1990–${maxYear}.`);
    if (!location) return setErr("Kota wajib diisi.");
    if (!phone || phone.replace(/\D/g, "").length < 9) return setErr("Nomor WhatsApp penjual wajib diisi (minimal 9 digit).");

    setErr("");
    if (editing) {
      const ok = store.edit(editing.id, {
        title,
        price,
        year,
        km,
        location,
        category,
        image,
        description,
        sellerPhone: phone,
        status: listingStatus,
      });
      if (!ok) return setErr("Gagal menyimpan. Periksa kembali isian.");
      toast(
        listingStatus === "running"
          ? "Listing diperbarui dan aktif ditayangkan di katalog pembeli!"
          : "Listing diperbarui."
      );
    } else {
      store.add({
        title,
        price,
        year,
        km,
        location,
        category,
        image,
        description,
        sellerPhone: phone,
        status: listingStatus,
        sellerId: store.owner() || "",
        sellerName: store.getDisplayName() || "",
      });
      toast(
        listingStatus === "running"
          ? "Listing berhasil ditayangkan ke katalog pembeli!"
          : "Listing ditambahkan, menunggu verifikasi."
      );
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
            {editing
              ? "Perbarui informasi dan status penayangan mobil."
              : "Isi data mobil dan tentukan apakah langsung ditayangkan ke pembeli."}
          </p>
        </div>
        <button
          onClick={() => onClose()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Tutup"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
          <CarImageUpload value={carImage} onChange={setCarImage} />
        </div>
        <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-3.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-800/40">
          <label className="mb-2 block text-xs font-semibold text-gray-800 dark:text-zinc-200">
            Status Penayangan Mobil
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setListingStatus("running")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                listingStatus === "running"
                  ? "bg-black text-white shadow-xs dark:bg-white dark:text-zinc-950"
                  : "bg-white text-gray-600 border border-gray-200 hover:text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Tayang ke Pembeli
            </button>
            <button
              type="button"
              onClick={() => setListingStatus("queued")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                listingStatus === "queued"
                  ? "bg-black text-white shadow-xs dark:bg-white dark:text-zinc-950"
                  : "bg-white text-gray-600 border border-gray-200 hover:text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Simpan Draf (Menunggu)
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
            {listingStatus === "running"
              ? "✓ Mobil langsung aktif muncul di halaman Beli Mobil dan dapat dicari serta dibeli oleh calon pembeli."
              : "Mobil disimpan sebagai draf/menunggu verifikasi dan tidak terlihat oleh pembeli sampai ditayangkan."}
          </p>
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
  const router = useRouter();
  const { role } = useRole();
  const store = useStore();
  const { toast } = useToast();
  const car = store.get(carId);

  function requireAuth(actionName: string): boolean {
    if (role === "guest") {
      toast(`Silakan masuk atau daftar akun untuk ${actionName}.`);
      router.push("/login");
      return false;
    }
    return true;
  }

  const [showReceipt, setShowReceipt] = React.useState(false);

  if (!car) return null;
  const c = car;
  const on = store.isFav(c.id);
  const offers = store.offersFor(c.id);

  if (showReceipt && c.purchase) {
    return <ReceiptModal car={c} purchase={c.purchase} onClose={() => setShowReceipt(false)} />;
  }

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
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Tutup"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-2xl font-bold text-black dark:text-white">{fmtRp(c.price)}</p>
        {c.description ? (
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{c.description}</p>
        ) : null}
        {c.purchase ? (
          <div className="mt-3 rounded-2xl border border-gray-200/90 bg-gray-50/80 p-3.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {c.purchase.paymentType === "booking"
                  ? "Booking Terkonfirmasi"
                  : c.purchase.method === "kredit"
                  ? "Pengajuan Kredit"
                  : "Unit Terjual"}
              </span>
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Lihat Nota Resmi
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-zinc-300">
              {c.purchase.method === "kredit"
                ? `Kredit — DP ${fmtRp(c.purchase.dp)} • ${c.purchase.tenor}× ${fmtRp(c.purchase.installment)}/bln • Pemohon: ${c.purchase.name}`
                : c.purchase.method === "tawar"
                ? `Terjual via tawaran ${fmtRp(c.price)} • Pembeli: ${c.purchase.name}`
                : `Dibeli tunai ${fmtRp(c.price)} • Pembeli: ${c.purchase.name}`}
            </p>
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
                if (!requireAuth("membeli mobil")) return;
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
              if (!requireAuth("menyimpan mobil ke favorit")) return;
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
              if (!requireAuth("mengajukan penawaran")) return;
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
                  {o.status === "pending" && (role === "admin" || role === "dealer") ? (
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
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Tutup"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
  const [paymentType, setPaymentType] = React.useState<"full" | "booking">("booking");
  const [deliveryMethod, setDeliveryMethod] = React.useState<"showroom" | "home_delivery" | "cod">("showroom");
  const [dpPct, setDpPct] = React.useState(30);
  const [tenor, setTenor] = React.useState(36);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");
  const [receipt, setReceipt] = React.useState<{ car: Car; purchase: Purchase } | null>(null);

  if (!car) return null;
  const c = car;

  const calc = checkoutCalc(c.price, dpPct, tenor, 8);
  const bookingFee = 2500000;

  function onCheckout() {
    if (!name.trim()) return setErr("Nama lengkap pembeli wajib diisi.");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) return setErr("Nomor WhatsApp/Telepon pembeli wajib diisi (minimal 9 digit).");
    if (deliveryMethod === "home_delivery" && !address.trim()) return setErr("Alamat pengiriman wajib diisi untuk opsi kirim ke rumah.");
    setErr("");

    const purchaseResult = store.buy(c.id, {
      method,
      paymentType,
      bookingFee,
      deliveryMethod,
      address: address.trim(),
      note: note.trim(),
      dp: calc.dp,
      tenor,
      rate: 8,
      installment: calc.installment,
      name: name.trim(),
      phone: phone.trim(),
    });

    if (!purchaseResult) return setErr("Gagal melakukan pembelian. Mobil mungkin sudah tidak tersedia.");

    toast(
      paymentType === "booking"
        ? "Booking berhasil! Unit mobil telah diamankan dan nota resmi diterbitkan."
        : method === "kredit"
        ? "Pengajuan kredit berhasil diproses! Nota resmi telah diterbitkan."
        : "Pembelian tunai berhasil dikonfirmasi! Nota resmi telah diterbitkan."
    );

    setReceipt({
      car: { ...c, status: "done", badge: "Terjual", purchase: purchaseResult },
      purchase: purchaseResult,
    });
  }

  // Jika pembelian sukses, tampilkan Nota Resmi
  if (receipt) {
    return (
      <ReceiptModal
        car={receipt.car}
        purchase={receipt.purchase}
        onClose={onClose}
      />
    );
  }

  const sellerPhone = c.sellerPhone || "0812-3456-7890";

  return (
    <ModalShell onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">Pemesanan & Pembelian Mobil</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Transaksi aman langsung terhubung dengan penjual terverifikasi
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black active:scale-97 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Tutup"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Ringkasan Mobil & Kontak Penjual */}
      <div className="mb-4 rounded-2xl border border-gray-200/80 bg-gray-50/80 p-3.5 text-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Unit Mobil Dipilih
            </span>
            <p className="font-extrabold text-black dark:text-white">{c.title} ({c.year})</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{c.category} • {c.location || "Indonesia"}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Harga Unit
            </span>
            <p className="text-base font-black text-black dark:text-white">{fmtRp(c.price)}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-gray-200/60 pt-2 text-xs text-gray-600 dark:border-zinc-800 dark:text-zinc-300">
          <span>WhatsApp Penjual Unit:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            {sellerPhone}
          </span>
        </div>
      </div>

      <FieldError msg={err} />

      <div className="space-y-4">
        {/* Pilihan Tipe Pembayaran (Booking Fee vs Pelunasan) */}
        <div>
          <label className={labelCls}>Skema Pembayaran Transaksi</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType("booking")}
              className={`rounded-xl border p-2.5 text-left text-xs transition active:scale-97 ${
                paymentType === "booking"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Tanda Jadi (Booking)</span>
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">Rekomendasi</span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">Bayar {fmtRp(bookingFee)} untuk kunci unit saat survei/COD</p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("full")}
              className={`rounded-xl border p-2.5 text-left text-xs transition active:scale-97 ${
                paymentType === "full"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              <div className="font-bold">Pelunasan Penuh</div>
              <p className="mt-1 text-[11px] opacity-80">Pembayaran 100% lunas saat serah terima BPKB & STNK</p>
            </button>
          </div>
        </div>

        {/* Metode Pembayaran: Tunai vs Kredit */}
        <div>
          <label className={labelCls}>Metode Pembiayaan</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("tunai")}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition active:scale-97 ${
                method === "tunai"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              }`}
            >
              Tunai Penuh (Cash)
            </button>
            <button
              type="button"
              onClick={() => setMethod("kredit")}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition active:scale-97 ${
                method === "kredit"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              }`}
            >
              Kredit (Cicilan Leasing)
            </button>
          </div>
        </div>

        {/* Form Simulasi Kredit jika opsi Kredit dipilih */}
        {method === "kredit" && (
          <div className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-zinc-800">
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
              <label className={labelCls}>Tenor Angsuran</label>
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
            <div className="rounded-xl bg-gray-100 p-3 text-xs dark:bg-zinc-900">
              <p className="font-semibold text-black dark:text-white">Estimasi Angsuran Bulanan:</p>
              <p className="mt-1 text-base font-extrabold text-blue-600 dark:text-blue-400">{fmtRp(calc.installment)} / bulan</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Bunga flat promo 8% / tahun • Pokok hutang {fmtRp(calc.principal)}</p>
            </div>
          </div>
        )}

        {/* Metode Serah Terima ala Marketplace */}
        <div>
          <label className={labelCls}>Metode Serah Terima Kendaraan</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "showroom", label: "Showroom", desc: "Ambil langsung" },
              { id: "cod", label: "Janji Temu", desc: "Inspeksi (COD)" },
              { id: "home_delivery", label: "Kirim Towing", desc: "Express ke alamat" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setDeliveryMethod(m.id as never)}
                className={`rounded-xl border p-2 text-center transition active:scale-97 ${
                  deliveryMethod === m.id
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                <p className="text-xs font-bold">{m.label}</p>
                <p className="text-[10px] opacity-75">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Data Pembeli */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Lengkap Pembeli *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Budi Santoso" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>No. WhatsApp Pembeli *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="cth: 081234567890" className={inputCls} />
          </div>
        </div>

        {/* Alamat Serah Terima / Domisili */}
        <div>
          <label className={labelCls}>
            Alamat Domisili / Lokasi Penyerahan {deliveryMethod === "home_delivery" ? "*" : "(Opsional)"}
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="cth: Jl. Sudirman No. 45, Jakarta Selatan"
            className={inputCls}
          />
        </div>

        {/* Catatan Pembeli */}
        <div>
          <label className={labelCls}>Catatan Tambahan untuk Penjual (Opsional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="cth: Mohon jadwalkan inspeksi Sabtu pagi jam 10..."
            className={inputCls}
          />
        </div>

        {/* Rincian Total Bayar & Tombol Konfirmasi */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {paymentType === "booking"
                ? "Total Tanda Jadi (Booking Unit):"
                : method === "kredit"
                ? "Total Uang Muka (DP):"
                : "Total Pembayaran Tunai:"}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {fmtRp(paymentType === "booking" ? bookingFee : method === "kredit" ? calc.dp : c.price)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
            ✓ Termasuk Garansi Mesin 1 Tahun & Diberikan Nota Pembelian Resmi setelah konfirmasi.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            Batal
          </button>
          <button
            type="button"
            onClick={onCheckout}
            className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {paymentType === "booking"
              ? "Konfirmasi & Kunci Unit"
              : method === "kredit"
              ? "Ajukan Kredit Sekarang"
              : "Konfirmasi Pembelian"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export { ReceiptModal };
