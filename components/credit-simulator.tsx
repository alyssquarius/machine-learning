"use client";
import Link from "next/link";
import * as React from "react";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { checkoutCalc, TENORS } from "@/lib/market";
import { fmtRp } from "@/lib/format";
import { useToast } from "@/components/toast";

export function CreditSimulator({ initialPrice = 250000000 }: { initialPrice?: number }) {
  const [price, setPrice] = React.useState(String(initialPrice));
  const [dp, setDp] = React.useState(30);
  const [tenor, setTenor] = React.useState(36);
  const [rate, setRate] = React.useState("8");
  const { toast } = useToast();
  const amount = Number(price),
    interest = Number(rate);
  const priceValid =
    price !== "" && Number.isFinite(amount) && amount >= 1000000 && amount <= 10000000000;
  const rateValid = rate !== "" && Number.isFinite(interest) && interest >= 0 && interest <= 25;
  const valid = priceValid && rateValid;
  const result = checkoutCalc(valid ? amount : 0, dp, tenor, valid ? interest : 0);
  function download() {
    if (!valid) return;
    const text = [
      `SIMULASI KREDIT AUTOBUYCARS`,
      `Harga mobil: ${fmtRp(amount)}`,
      `Uang muka (${dp}%): ${fmtRp(result.dp)}`,
      `Lama cicilan: ${tenor} bulan`,
      `Bunga flat per tahun: ${interest}%`,
      `Estimasi cicilan: ${fmtRp(result.installment)}/bulan`,
      `Total cicilan: ${fmtRp(result.total)}`,
      `Total pengeluaran (uang muka + cicilan): ${fmtRp(result.dp + result.total)}`,
      `Simulasi tidak mencakup biaya administrasi, asuransi, dan provisi. Bukan penawaran pembiayaan.`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "simulasi-autobuycars.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Ringkasan simulasi berhasil diunduh.");
  }
  return (
    <div className="credit-page">
      <PageHeader
        eyebrow="RENCANAKAN ANGGARAN"
        title="Hitung Cicilan Mobil"
        description="Isi harga mobil, pilih uang muka, lalu tentukan lama cicilan."
        actions={
          <Link href="/beli" className="button-secondary">
            <Icon name="car" className="h-4 w-4" />
            Kembali ke katalog
          </Link>
        }
      />
      <div className="credit-mobile-preview">
        <span>Perkiraan cicilan per bulan</span>
        <strong>{valid ? fmtRp(result.installment) : "Lengkapi data di bawah"}</strong>
        <small>
          {valid
            ? `${tenor / 12} tahun · uang muka ${fmtRp(result.dp)}`
            : "Isi harga mobil dan asumsi bunga yang valid."}
        </small>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="surface p-5 sm:p-8" aria-label="Atur simulasi cicilan">
          <div className="credit-step">
            <span className="credit-step-number" aria-hidden="true">
              1
            </span>
            <div>
              <label htmlFor="credit-price" className="text-sm font-semibold">
                Harga mobil
              </label>
              <p id="price-help" className="mt-1 text-xs text-slate-500">
                Masukkan harga dalam rupiah. Harga dari detail mobil terisi otomatis.
              </p>
            </div>
          </div>
          <input
            id="credit-price"
            aria-label="Harga kendaraan (Rp)"
            aria-describedby="price-help price-feedback"
            aria-invalid={!priceValid}
            type="number"
            min="1000000"
            max="10000000000"
            step="1000000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-4 w-full border px-4 py-3 text-base font-semibold"
          />
          <p
            id="price-feedback"
            className={`mt-2 text-xs ${priceValid ? "text-slate-500" : "text-amber-700 dark:text-amber-300"}`}
          >
            {priceValid ? fmtRp(amount) : "Isi harga antara Rp1 juta dan Rp10 miliar."}
          </p>
          <div className="credit-step mt-7">
            <span className="credit-step-number" aria-hidden="true">
              2
            </span>
            <div>
              <label htmlFor="credit-dp" className="text-sm font-semibold">
                Uang muka
              </label>
              <p id="dp-help" className="mt-1 text-xs text-slate-500">
                Uang yang dibayar di awal. Sisa harga mobil dibayar melalui cicilan.
              </p>
            </div>
          </div>
          <div className="my-4 flex flex-wrap justify-between gap-2 text-sm font-semibold">
            <span>{dp}% dari harga mobil</span>
            <span className="text-sky-700 dark:text-sky-300">
              {priceValid ? fmtRp((amount * dp) / 100) : "Belum dihitung"}
            </span>
          </div>
          <input
            id="credit-dp"
            aria-describedby="dp-help"
            aria-valuetext={`${dp} persen`}
            type="range"
            min="10"
            max="80"
            step="5"
            value={dp}
            onChange={(e) => setDp(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>10%</span>
            <span>80%</span>
          </div>
          <fieldset className="mt-7">
            <legend className="credit-step">
              <span className="credit-step-number" aria-hidden="true">
                3
              </span>
              <span className="text-sm font-semibold">Lama cicilan</span>
            </legend>
            <p id="period-help" className="mt-2 text-xs text-slate-500">
              Pilih berapa lama kamu ingin mencicil.
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {TENORS.map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={tenor === t}
                  aria-label={`${t / 12} tahun, ${t} bulan`}
                  onClick={() => setTenor(t)}
                  className={`credit-period ${tenor === t ? "is-selected" : ""}`}
                >
                  <strong>{t / 12} tahun</strong>
                  <small>{t} bulan</small>
                </button>
              ))}
            </div>
          </fieldset>
          <details
            className="mt-7 rounded-xl border border-sky-100 p-4 dark:border-slate-700"
            open={!rateValid || undefined}
          >
            <summary className="cursor-pointer text-xs font-semibold">
              Asumsi bunga: {rate || "0"}% per tahun{" "}
              <span className="font-normal text-slate-500">· Ubah</span>
            </summary>
            <label htmlFor="credit-rate" className="mt-4 block text-xs font-semibold">
              Asumsi bunga flat per tahun (%)
            </label>
            <input
              id="credit-rate"
              aria-invalid={!rateValid}
              aria-describedby="rate-help"
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-2 w-full border px-4 py-3 text-sm"
            />
            <p id="rate-help" className="mt-2 text-xs leading-relaxed text-slate-500">
              Bunga flat dihitung dari sisa harga awal yang dicicil, bukan dari saldo tiap bulan.
              Angka ini hanya asumsi, bukan bunga dari bank.
            </p>
            {!rateValid && (
              <p role="alert" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Isi asumsi bunga antara 0% dan 25%.
              </p>
            )}
          </details>
        </section>
        <aside className="space-y-4">
          <div className="credit-summary rounded-2xl bg-sky-950 p-6 text-white sm:p-8">
            <p className="text-xs font-semibold text-sky-200">PERKIRAAN CICILAN</p>
            <output aria-live="polite" className="mt-4 block text-3xl font-semibold tracking-tight">
              <span key={`${valid}-${result.installment}`} className="credit-value-enter block">
                {valid ? fmtRp(result.installment) : "Belum dihitung"}
              </span>
            </output>
            <p className="mt-1 text-xs text-sky-100">
              per bulan selama {tenor} bulan ({tenor / 12} tahun)
            </p>
            <dl className="my-6 space-y-4 text-xs">
              {[
                ["Harga mobil", fmtRp(valid ? amount : 0)],
                ["Dibayar di awal (uang muka)", fmtRp(result.dp)],
                ["Sisa harga yang dicicil", fmtRp(result.principal)],
                ["Perkiraan total bunga", fmtRp(result.total - result.principal)],
                ["Total uang muka + cicilan", fmtRp(result.dp + result.total)],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex justify-between gap-4 ${i === 4 ? "border-t border-white/20 pt-4 font-semibold" : ""}`}
                >
                  <dt className="text-sky-100">{label}</dt>
                  <dd className="text-right">{valid ? value : "Belum dihitung"}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={download}
              disabled={!valid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-100 px-4 py-3 text-xs font-semibold text-sky-950 disabled:opacity-40"
            >
              <Icon name="download" className="h-4 w-4" />
              Simpan hasil perhitungan
            </button>
          </div>
          <p className="surface p-4 text-xs leading-relaxed text-slate-500">
            Perkiraan belum mencakup administrasi, asuransi, dan provisi. Hasil ini bukan
            persetujuan atau penawaran pembiayaan.
          </p>
          <Link
            href={`/beli?max=${valid ? amount : initialPrice}`}
            className="button-secondary w-full"
          >
            Cari mobil sesuai anggaran
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
