"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useStore, imageFor } from "@/components/store-provider";
import { CarCard } from "@/components/car-card";
import { CheckoutModal, DetailModal, OfferModal } from "@/components/modals";
import { useToast } from "@/components/toast";
import { CATEGORIES, INDONESIA_CITIES } from "@/lib/cities";
import { EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useRole } from "@/components/role-provider";
import { PRICE_PRESETS, resolveBuyYearValue } from "@/lib/market";

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white";
const inputPlain =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white";
const selectCls =
  "rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 outline-none transition appearance-none focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white";

function resolveBuyLocValue(raw: unknown, used: string[]): string {
  const v = String(raw ?? "").trim();
  if (!v) return "all";
  const low = v.toLocaleLowerCase("id");
  if (low === "all" || low === "semua" || low === "semua lokasi") return "all";
  const all = [...new Set([...INDONESIA_CITIES, ...used])];
  const hit = all.find((c) => c.toLocaleLowerCase("id") === low);
  if (hit) return hit;
  return "q:" + v;
}

export default function BeliClient() {
  const store = useStore();
  const { role } = useRole();
  const { toast } = useToast();
  const params = useSearchParams();
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [sort, setSort] = React.useState("new");
  const [min, setMin] = React.useState("");
  const [max, setMax] = React.useState("");
  const [locRaw, setLocRaw] = React.useState("");
  const [loc, setLoc] = React.useState("all");
  const [yearRaw, setYearRaw] = React.useState("");
  const [year, setYear] = React.useState("all");
  const [preset, setPreset] = React.useState<string>("all");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [buyId, setBuyId] = React.useState<string | null>(null);
  const locTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const usedCities = React.useMemo(
    () => [
      ...new Set(
        store
          .all()
          .map((c) => (c.location || "").trim())
          .filter((x) => x && x !== "-"),
      ),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.cars],
  );
  const cats = React.useMemo(
    () => [
      ...new Set(
        store
          .all()
          .map((c) => c.category)
          .filter(Boolean),
      ),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.cars],
  );
  const years = React.useMemo(
    () =>
      [
        ...new Set(
          store
            .all()
            .map((c) => Number(c.year))
            .filter((y) => y > 0),
        ),
      ].sort((a, b) => b - a),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.cars],
  );

  // Deep-link: /beli?q=...&detail=...
  React.useEffect(() => {
    const pq = params.get("q");
    if (pq) setQ(pq);
    const priceMax = params.get("max");
    if (priceMax && Number.isFinite(Number(priceMax)) && Number(priceMax) > 0) setMax(priceMax);
    const d = params.get("detail");
    if (d) setDetailId(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function onLocChange(v: string) {
    setLocRaw(v);
    if (locTimer.current) clearTimeout(locTimer.current);
    locTimer.current = setTimeout(
      () => setLoc(resolveBuyLocValue(v, usedCities)),
      250,
    );
  }
  function onYearChange(v: string) {
    const digits = v.replace(/[^\d]/g, "").slice(0, 4);
    setYearRaw(digits);
    if (yearTimer.current) clearTimeout(yearTimer.current);
    yearTimer.current = setTimeout(
      () => setYear(resolveBuyYearValue(digits)),
      300,
    );
  }
  function applyPreset(id: string) {
    const p = PRICE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    setMin(p.min === "" ? "" : String(p.min));
    setMax(p.max === "" ? "" : String(p.max));
  }
  function resetFilters() {
    setQ("");
    setCat("all");
    setSort("new");
    setMin("");
    setMax("");
    setLocRaw("");
    setLoc("all");
    setYearRaw("");
    setYear("all");
    setPreset("all");
    toast("Filter dikembalikan ke awal.");
  }

  const list = React.useMemo(() => {
    let out = store.all().filter((c) => c.status === "running");
    const needle = q.trim().toLowerCase();
    if (needle)
      out = out.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          (c.location || "").toLowerCase().includes(needle) ||
          (c.category || "").toLowerCase().includes(needle) ||
          (c.description || "").toLowerCase().includes(needle),
      );
    if (cat !== "all") out = out.filter((c) => c.category === cat);
    if (loc !== "all") {
      if (loc.startsWith("q:")) {
        const lq = loc.slice(2).toLocaleLowerCase("id");
        if (lq)
          out = out.filter((c) =>
            String(c.location || "")
              .toLocaleLowerCase("id")
              .includes(lq),
          );
      } else {
        out = out.filter((c) => (c.location || "-") === loc);
      }
    }
    if (year !== "all") {
      const yf = year.startsWith("q:") ? year.slice(2) : year;
      if (year.startsWith("q:"))
        out = out.filter((c) =>
          yf ? String(c.year || "").includes(yf) : true,
        );
      else out = out.filter((c) => String(c.year) === yf);
    }
    const minN = min === "" ? null : Number(min);
    const maxN = max === "" ? null : Number(max);
    if (minN != null) out = out.filter((c) => Number(c.price) >= minN);
    if (maxN != null) out = out.filter((c) => Number(c.price) <= maxN);
    if (sort === "cheap") out.sort((a, b) => a.price - b.price);
    else if (sort === "exp") out.sort((a, b) => b.price - a.price);
    else if (sort === "love")
      out.sort((a, b) => (b.interest || 0) - (a.interest || 0));
    else out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [store.cars, q, cat, sort, min, max, loc, year]);

  const dirty =
    cat !== "all" ||
    loc !== "all" ||
    year !== "all" ||
    min !== "" ||
    max !== "" ||
    q.trim() !== "" ||
    sort !== "new";

  return (
    <div>
      <section className="hero-panel catalog-hero"><div className="hero-photo" /><p className="hero-eyebrow">KATALOG MOBIL</p><h1>Temukan mobil pilihanmu.</h1><p>Cari kendaraan sesuai kebutuhan dan anggaranmu.</p></section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow !mb-1">KATALOG KENDARAAN</p><h2 className="text-base font-semibold">{list.length} pilihan untuk dijelajahi</h2></div><Link href="/simulasi" className="button-secondary"><Icon name="calculator" className="h-4 w-4" />Hitung rencana cicilan</Link></div>

      <div className="surface filter-bar flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              aria-label="Cari merek, model, atau kota"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Cari merek, model, atau kota..."
              className={inputCls}
            />
          </div>
          <select
            aria-label="Kategori mobil"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className={selectCls}
          >
            <option value="all">Semua kategori</option>
            {[...new Set([...CATEGORIES, ...cats])].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Urutkan mobil"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={selectCls}
          >
            <option value="new">Terbaru</option>
            <option value="cheap">Termurah</option>
            <option value="exp">Termahal</option>
            <option value="love">Paling diminati</option>
          </select>
        </div>
        <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} aria-expanded={advancedOpen} aria-controls="advanced-catalog-filters" className="button-secondary self-start lg:hidden"><Icon name="cog" className="h-3.5 w-3.5" />{advancedOpen ? "Tutup filter tambahan" : "Filter harga, kota & tahun"}</button>
        <div id="advanced-catalog-filters" className={`advanced-filters ${advancedOpen ? "is-open" : ""}`}>
          <input
            aria-label="Harga minimum"
            value={min}
            onChange={(e) => {
              setMin(e.target.value.replace(/[^\d]/g, ""));
              setPreset("custom");
            }}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Harga min (Rp)"
            className={inputPlain}
          />
          <input
            aria-label="Harga maksimum"
            value={max}
            onChange={(e) => {
              setMax(e.target.value.replace(/[^\d]/g, ""));
              setPreset("custom");
            }}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Harga maks (Rp)"
            className={inputPlain}
          />
          <div>
            <input
              aria-label="Kota kendaraan"
              value={locRaw}
              onChange={(e) => onLocChange(e.target.value)}
              list="buy-loc-list"
              type="text"
              placeholder="Ketik & pilih kota..."
              autoComplete="off"
              className={inputPlain}
            />
            <datalist id="buy-loc-list">
              {[...new Set([...INDONESIA_CITIES, ...usedCities])]
                .sort((a, b) => a.localeCompare(b, "id"))
                .map((c) => (
                  <option key={c} value={c} />
                ))}
            </datalist>
          </div>
          <div>
            <input
              aria-label="Tahun kendaraan"
              value={yearRaw}
              onChange={(e) => onYearChange(e.target.value)}
              onBeforeInput={(e) => {
                if (
                  e.nativeEvent instanceof InputEvent &&
                  e.nativeEvent.data &&
                  /[^\d]/.test(e.nativeEvent.data)
                )
                  e.preventDefault();
              }}
              onPaste={(e) => {
                const t = e.clipboardData
                  .getData("text")
                  .replace(/[^\d]/g, "")
                  .slice(0, 4);
                e.preventDefault();
                onYearChange(t);
              }}
              list="buy-year-list"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Ketik tahun..."
              autoComplete="off"
              className={inputPlain}
            />
            <datalist id="buy-year-list">
              {years.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`filter-pill rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  preset === p.id
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-black dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {dirty ? (
            <button
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Reset filter
            </button>
          ) : null}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="surface"><EmptyState icon="car" title={dirty ? "Belum menemukan yang cocok?" : "Pilihan berikutnya sedang dipersiapkan."} description={dirty ? "Coba rentang harga yang lebih luas, atau mulai kembali dengan semua kategori." : "Belum ada mobil yang ditayangkan pada browser ini. Sambil menunggu, kamu bisa merencanakan anggaran pembelian."}>{dirty ? <button onClick={resetFilters} className="button-primary">Reset pencarian<Icon name="arrow" className="h-4 w-4" /></button> : <div className="flex flex-wrap justify-center gap-2"><Link href="/simulasi" className="button-primary">Rencanakan anggaran<Icon name="arrow" className="h-4 w-4" /></Link>{["admin", "dealer"].includes(role) ? <Link href="/jual" className="button-secondary">Tambahkan listing</Link> : null}</div>}</EmptyState></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <CarCard
              key={c.id}
              car={{ ...c, image: c.image || imageFor(c.category) }}
              onDetail={setDetailId}
              onBuy={setBuyId}
              onOffer={setOfferId}
            />
          ))}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-gray-400"><Icon name="help" className="h-3.5 w-3.5 shrink-0" />Katalog saat ini menggunakan data pada browser ini. Listing belum tersinkron antarperangkat.</p>

      {detailId ? (
        <DetailModal
          carId={detailId}
          onClose={() => setDetailId(null)}
          onBuy={setBuyId}
          onOffer={setOfferId}
        />
      ) : null}
      {offerId ? (
        <OfferModal carId={offerId} onClose={() => setOfferId(null)} />
      ) : null}
      {buyId ? (
        <CheckoutModal carId={buyId} onClose={() => setBuyId(null)} />
      ) : null}
    </div>
  );
}
