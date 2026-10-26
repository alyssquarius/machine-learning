"use client";

import * as React from "react";
import { type Car, type Purchase } from "@/components/store-provider";
import { fmtRp } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";

interface ReceiptModalProps {
  car: Car;
  purchase: Purchase;
  onClose: () => void;
}

export function ReceiptModal({ car, purchase, onClose }: ReceiptModalProps) {
  // Format tanggal dan jam transaksi lokal
  const dateFormatted = React.useMemo(() => {
    const d = new Date(purchase.ts || Date.now());
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [purchase.ts]);

  // Siapkan nomor WhatsApp penjual (prioritas: sellerPhone di listing -> fallback admin)
  const sellerPhone = purchase.sellerPhone || car.sellerPhone || "6281234567890";

  // Pesan WhatsApp otomatis yang rapi dan profesional untuk penjual
  const waMessage = React.useMemo(() => {
    const isCredit = purchase.method === "kredit";
    const isBooking = purchase.paymentType === "booking";

    let paymentSummary = "";
    if (isBooking) {
      paymentSummary = `Tanda Jadi (Booking Fee): ${fmtRp(purchase.bookingFee || 2500000)} (Sisa dilunasi saat serah terima unit)`;
    } else if (isCredit) {
      paymentSummary = `Kredit Cicilan (DP: ${fmtRp(purchase.dp)}, Tenor: ${purchase.tenor} bulan, Cicilan: ${fmtRp(purchase.installment)}/bulan)`;
    } else {
      paymentSummary = `Tunai Penuh (Cash): ${fmtRp(car.price)}`;
    }

    const deliveryLabel =
      purchase.deliveryMethod === "home_delivery"
        ? "Kirim ke Alamat Rumah"
        : purchase.deliveryMethod === "cod"
        ? "Janji Temu Inspeksi (COD)"
        : "Ambil di Showroom";

    return `*NOTA PEMESANAN KENDARAAN — AUTOBUYCARS*
---------------------------------------
No. Invoice : *#${purchase.invoiceNumber}*
Tanggal     : ${dateFormatted}
Status      : *${isBooking ? "BOOKING DIKONFIRMASI" : isCredit ? "PENGAJUAN KREDIT" : "LUNAS"}*

*DETAIL KENDARAAN:*
• Unit       : *${car.title}* (${car.year})
• Kategori   : ${car.category}
• Harga Unit : ${fmtRp(car.price)}
• Lokasi     : ${car.location}

*RINCIAN PEMBAYARAN:*
• Skema      : ${paymentSummary}
• Pengiriman : ${deliveryLabel}
${purchase.address ? `• Alamat     : ${purchase.address}\n` : ""}${purchase.note ? `• Catatan    : ${purchase.note}\n` : ""}
*DATA PEMBELI:*
• Nama       : *${purchase.name}*
• No. Kontak : ${purchase.phone}

Halo Penjual, saya telah melakukan pemesanan mobil ini melalui platform AutoBuyCars. Mohon konfirmasi jadwal cek fisik / serah terima unit. Terima kasih!`;
  }, [car, purchase, dateFormatted]);

  // Handler buka WhatsApp penjual
  const openWhatsApp = () => {
    let cleanPhone = sellerPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) {
      cleanPhone = "62" + cleanPhone;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Handler cetak nota / simpan PDF
  const handlePrint = () => {
    window.print();
  };

  const isBooking = purchase.paymentType === "booking";
  const isCredit = purchase.method === "kredit";

  // Perhitungan rincian pembayaran saat ini vs sisa
  const amountPaidNow = isBooking
    ? purchase.bookingFee || 2500000
    : isCredit
    ? purchase.dp
    : car.price;

  const remainingBalance = isBooking
    ? Math.max(0, car.price - (purchase.bookingFee || 2500000))
    : isCredit
    ? Math.max(0, car.price - purchase.dp)
    : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static print:z-0">
      {/* Backdrop blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 print:hidden"
        onClick={onClose}
      />

      {/* Kontainer Nota ala Apple */}
      <div className="relative my-6 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl transition-all sm:p-8 dark:border-white/10 dark:bg-zinc-900/95 print:my-0 print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-none print:p-8 print:shadow-none print:bg-white print:text-black">
        {/* Tombol Close & Badge atas */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 print:border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white shadow-xs dark:bg-white dark:text-zinc-950">
              <span className="text-sm font-black tracking-tight">ABC</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                AutoBuyCars
              </p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                Official Purchase Receipt & Contract
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isBooking
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  : isCredit
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isBooking
                ? "BOOKING TERKONFIRMASI"
                : isCredit
                ? "PENGAJUAN KREDIT"
                : "LUNAS"}
            </span>
            <button
              onClick={onClose}
              className="rounded-full border border-gray-200 p-2 text-gray-400 hover:bg-gray-100 hover:text-black active:scale-95 print:hidden dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Tutup nota"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Informasi Utama Nota */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-b border-gray-100 pb-5 text-xs sm:grid-cols-4 print:border-gray-200 dark:border-zinc-800">
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-zinc-500">
              No. Invoice
            </p>
            <p className="mt-0.5 font-mono font-bold text-black dark:text-white">
              #{purchase.invoiceNumber}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-zinc-500">
              Tanggal Transaksi
            </p>
            <p className="mt-0.5 font-medium text-black dark:text-white">
              {dateFormatted}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-zinc-500">
              Metode Bayar
            </p>
            <p className="mt-0.5 font-semibold text-black dark:text-white capitalize">
              {isBooking ? "Tanda Jadi (Booking)" : purchase.method === "kredit" ? "Kredit (Cicilan)" : "Tunai (Cash)"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-zinc-500">
              Metode Serah Terima
            </p>
            <p className="mt-0.5 font-semibold text-black dark:text-white">
              {purchase.deliveryMethod === "home_delivery"
                ? "Kirim ke Rumah"
                : purchase.deliveryMethod === "cod"
                ? "Inspeksi (COD)"
                : "Ambil di Showroom"}
            </p>
          </div>
        </div>

        {/* Kartu Mobil yang Dipesan */}
        <div className="mt-5 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 backdrop-blur-sm sm:flex sm:items-center sm:gap-4 dark:border-zinc-800/80 dark:bg-zinc-800/40">
          {car.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.image}
              alt={car.title}
              className="h-20 w-28 shrink-0 rounded-xl object-cover shadow-xs"
            />
          ) : (
            <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-xs font-bold text-gray-500 dark:bg-zinc-800">
              No Image
            </div>
          )}
          <div className="mt-3 flex-1 sm:mt-0">
            <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-2xs dark:bg-zinc-700 dark:text-white">
              {car.category} • {car.year}
            </span>
            <h4 className="mt-1 text-base font-extrabold text-black dark:text-white">
              {car.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {car.km ? `${car.km.toLocaleString("id-ID")} km` : "Km Rendah"} • Lokasi: {car.location || "Indonesia"}
            </p>
          </div>
          <div className="mt-3 sm:mt-0 sm:text-right">
            <p className="text-[10px] uppercase font-semibold text-gray-400 dark:text-zinc-500">
              Harga Kendaraan
            </p>
            <p className="text-lg font-black tracking-tight text-black dark:text-white">
              {fmtRp(car.price)}
            </p>
          </div>
        </div>

        {/* Rincian Finansial & Tagihan */}
        <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Rincian Pembayaran
          </h5>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-zinc-300">
              <span>Harga Satuan Kendaraan</span>
              <span className="font-semibold text-black dark:text-white">{fmtRp(car.price)}</span>
            </div>

            {isCredit && (
              <>
                <div className="flex justify-between text-gray-600 dark:text-zinc-300">
                  <span>Uang Muka (DP) Terpilih</span>
                  <span className="font-semibold text-black dark:text-white">{fmtRp(purchase.dp)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-zinc-300">
                  <span>Skema Cicilan Kredit</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {purchase.tenor} bulan × {fmtRp(purchase.installment)} / bln
                  </span>
                </div>
              </>
            )}

            {isBooking && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Tanda Jadi (Booking Unit)</span>
                <span>{fmtRp(purchase.bookingFee || 2500000)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600 dark:text-zinc-300">
              <span>Garansi Mesin & Transmisi 1 Tahun</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">GRATIS (Diskon 100%)</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-zinc-300">
              <span>Biaya Administrasi & Verifikasi Dokumen</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">GRATIS (Promo ABC)</span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-2.5 dark:border-zinc-800">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-black dark:text-white">
                  {isBooking ? "Total Dibayarkan Saat Ini" : isCredit ? "Total Uang Muka (DP) Saat Ini" : "Total Pembayaran"}
                </span>
                <span className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {fmtRp(amountPaidNow)}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div className="mt-1 flex justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                  <span>
                    {isCredit
                      ? "Sisa Pokok Hutang (dibiayai leasing)"
                      : "Sisa Pelunasan saat Cek Fisik Unit"}
                  </span>
                  <span className="font-semibold text-black dark:text-white">
                    {fmtRp(remainingBalance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Pembeli & Penjual */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Kolom Pembeli */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-800/30">
            <h6 className="font-bold uppercase tracking-wider text-[10px] text-gray-400 dark:text-zinc-500">
              Data Pembeli
            </h6>
            <p className="mt-1 font-bold text-black dark:text-white">{purchase.name}</p>
            <p className="text-gray-500 dark:text-zinc-400">{purchase.phone}</p>
            {purchase.address && (
              <p className="mt-1.5 text-gray-600 dark:text-zinc-300">
                <span className="font-semibold text-black dark:text-white">Alamat:</span> {purchase.address}
              </p>
            )}
            {purchase.note && (
              <p className="mt-1 text-gray-600 dark:text-zinc-300">
                <span className="font-semibold text-black dark:text-white">Catatan:</span> {purchase.note}
              </p>
            )}
          </div>

          {/* Kolom Penjual */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-800/30">
            <h6 className="font-bold uppercase tracking-wider text-[10px] text-gray-400 dark:text-zinc-500">
              Data Penjual / Showroom
            </h6>
            <p className="mt-1 font-bold text-black dark:text-white">Dealer Terverifikasi AutoBuyCars</p>
            <p className="text-gray-500 dark:text-zinc-400">WhatsApp: {sellerPhone}</p>
            <p className="mt-1 text-gray-600 dark:text-zinc-300">
              <span className="font-semibold text-black dark:text-white">Lokasi Unit:</span> {car.location || "Indonesia"}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              ✓ Garansi Keaslian Dokumen BPKB & STNK
            </div>
          </div>
        </div>

        {/* Tombol Aksi di bagian bawah */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row print:hidden">
          <button
            type="button"
            onClick={openWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#20BA5A] active:scale-95"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Kirim Nota ke WhatsApp Penjual
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak / Simpan Nota (PDF)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:text-black active:scale-95 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white"
          >
            Tutup
          </button>
        </div>

        {/* Footer print note */}
        <p className="mt-4 text-center text-[10px] text-gray-400 dark:text-zinc-500">
          Nota ini diterbitkan secara elektronik oleh AutoBuyCars dan berlaku sebagai bukti sah pemesanan kendaraan.
        </p>
      </div>
    </div>
  );
}
