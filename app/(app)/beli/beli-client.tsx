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
import { CarDiscovery } from "@/components/car-discovery";
import {
  CAR_BRANDS,
  DISCOVERY_GROUPS,
  vehicleBrand,
  vehicleModel,
  matchesDiscovery,
} from "@/lib/vehicle-discovery";
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
  const [brand, setBrand] = React.useState("all");
  const [model, setModel] = React.useState("all");
  const [group, setGroup] = React.useState("all");
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
  const resultsRef = React.useRef<HTMLParagraphElement>(null);
  const locTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const available = React.useMemo(
    () => store.all().filter((c) => c.status === "running"),
    [store.cars],
  );
  const brands = [...new Set([...CAR_BRANDS, ...available.map(vehicleBrand)])];
  const models = [
    ...new Set(
      available
        .filter((c) => brand !== "all" && vehicleBrand(c) === brand)
        .map(vehicleModel)
        .filter(Boolean),
    ),
  ].sort();
  const activeGroup = DISCOVERY_GROUPS.find((g) => g.id === group);
  function chooseBrand(value: string) {
    setBrand(value);
    setModel("all");
  }

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
    if (locTimer.current) clearTimeout(locTimer.current);
    if (yearTimer.current) clearTimeout(yearTimer.current);
    setQ(params.get("q") || "");
    setBrand(params.get("brand")?.slice(0, 40) || "all");
    setModel(params.get("model")?.slice(0, 60) || "all");
    const requestedGroup = params.get("group");
    setGroup(DISCOVERY_GROUPS.some((g) => g.id === requestedGroup) ? requestedGroup! : "all");
    const requestedCategory = params.get("category");
    setCat(CATEGORIES.some((c) => c === requestedCategory) ? requestedCategory! : "all");
    for (const [key, setValue] of [
      ["min", setMin],
      ["max", setMax],
    ] as const) {
      const value = params.get(key);
      setValue(value && Number.isFinite(Number(value)) && Number(value) > 0 ? value : "");
    }
    const location = params.get("location") || "";
    setLocRaw(location);
    setLoc(resolveBuyLocValue(location, usedCities));
    const selectedYear = params.get("year") || "";
    setYearRaw(selectedYear);
    setYear(resolveBuyYearValue(selectedYear));
    const requestedSort = params.get("sort");
    setSort(["cheap", "exp", "love"].includes(requestedSort || "") ? requestedSort! : "new");
    const matchPreset = PRICE_PRESETS.find(
      (p) =>
        String(p.min) === (params.get("min") || "") && String(p.max) === (params.get("max") || ""),
    );
    setPreset(matchPreset?.id || "custom");
    const d = params.get("detail");
    setDetailId(d || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  React.useEffect(
    () => () => {
      if (locTimer.current) clearTimeout(locTimer.current);
      if (yearTimer.current) clearTimeout(yearTimer.current);
    },
    [],
  );

  function onLocChange(v: string) {
    setLocRaw(v);
    if (locTimer.current) clearTimeout(locTimer.current);
    locTimer.current = setTimeout(() => setLoc(resolveBuyLocValue(v, usedCities)), 250);
  }
  function onYearChange(v: string) {
    const digits = v.replace(/[^\d]/g, "").slice(0, 4);
    setYearRaw(digits);
    if (yearTimer.current) clearTimeout(yearTimer.current);
    yearTimer.current = setTimeout(() => setYear(resolveBuyYearValue(digits)), 300);
  }
  function applyPreset(id: string) {
    const p = PRICE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    setMin(p.min === "" ? "" : String(p.min));
    setMax(p.max === "" ? "" : String(p.max));
  }
  function resetFilters() {
    if (locTimer.current) clearTimeout(locTimer.current);
    if (yearTimer.current) clearTimeout(yearTimer.current);
    setBrand("all");
    setModel("all");
    setGroup("all");
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
    window.history.replaceState(null, "", window.location.pathname);
    toast("Filter dikembalikan ke awal.");
  }

  const list = React.useMemo(() => {
    let out = available.filter((c) => matchesDiscovery(c, { brand, model, group }));
    const needle = q.trim().toLowerCase();
    if (needle)
      out = out.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          vehicleBrand(c).toLowerCase().includes(needle) ||
          vehicleModel(c).toLowerCase().includes(needle) ||
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
        out = out.filter((c) => (yf ? String(c.year || "").includes(yf) : true));
      else out = out.filter((c) => String(c.year) === yf);
    }
    const minN = min === "" ? null : Number(min);
    const maxN = max === "" ? null : Number(max);
    if (minN != null) out = out.filter((c) => Number(c.price) >= minN);
    if (maxN != null) out = out.filter((c) => Number(c.price) <= maxN);
    if (sort === "cheap") out.sort((a, b) => a.price - b.price);
    else if (sort === "exp") out.sort((a, b) => b.price - a.price);
    else if (sort === "love") out.sort((a, b) => (b.interest || 0) - (a.interest || 0));
    else out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [available, brand, model, group, q, cat, sort, min, max, loc, year]);

  const dirty =
    brand !== "all" ||
    model !== "all" ||
    group !== "all" ||
    cat !== "all" ||
    loc !== "all" ||
    year !== "all" ||
    min !== "" ||
    max !== "" ||
    q.trim() !== "" ||
    sort !== "new";

  const activeFilters = [
    ...(brand !== "all" ? [{ label: brand, clear: () => chooseBrand("all") }] : []),
    ...(model !== "all" ? [{ label: model, clear: () => setModel("all") }] : []),
    ...(activeGroup ? [{ label: activeGroup.label, clear: () => setGroup("all") }] : []),
    ...(cat !== "all" ? [{ label: cat, clear: () => setCat("all") }] : []),
    ...(q.trim() ? [{ label: `Cari: ${q}`, clear: () => setQ("") }] : []),
    ...(min || max
      ? [
          {
            label: `Rp${Number(min || 0).toLocaleString("id-ID")} – ${max ? "Rp" + Number(max).toLocaleString("id-ID") : "tanpa batas"}`,
            clear: () => {
              setMin("");
              setMax("");
              setPreset("all");
            },
          },
        ]
      : []),
    ...(loc !== "all"
      ? [
          {
            label: locRaw,
            clear: () => {
              if (locTimer.current) clearTimeout(locTimer.current);
              setLoc("all");
              setLocRaw("");
            },
          },
        ]
      : []),
    ...(year !== "all"
      ? [
          {
            label: yearRaw,
            clear: () => {
              if (yearTimer.current) clearTimeout(yearTimer.current);
              setYear("all");
              setYearRaw("");
            },
          },
        ]
      : []),
  ];
  const searchSummary = [
    activeGroup?.label,
    brand !== "all" ? brand : "",
    model !== "all" ? model : "",
    cat !== "all" ? cat : "",
    max ? `anggaran sampai Rp${Number(max).toLocaleString("id-ID")}` : "",
    locRaw,
    q,
  ]
    .filter(Boolean)
    .join(", ");
  async function copySearch() {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({
      q,
      brand: brand === "all" ? "" : brand,
      model: model === "all" ? "" : model,
      group: group === "all" ? "" : group,
      category: cat === "all" ? "" : cat,
      min,
      max,
      location: locRaw,
      year: yearRaw,
      sort: sort === "new" ? "" : sort,
    }))
      if (value) query.set(key, value);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/beli?${query.toString()}`);
      toast("Tautan pencarian disalin.");
    } catch {
      toast("Tautan belum dapat disalin. Izinkan akses clipboard lalu coba lagi.");
    }
  }

  return (
    <div className={role === "buyer" || role === "guest" ? "buyer-catalog" : ""}>
      <section className="hero-panel catalog-hero">
        <div className="hero-photo" />
        <p className="hero-eyebrow">KATALOG MOBIL</p>
        <h1>Cari mobil dengan mudah.</h1>
        <p>Cari nama mobil, pilih anggaran, lalu buka foto untuk melihat detail.</p>
      </section>
      {available.some((c) => c.isDemo) && (
        <p className="catalog-demo-note mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          Katalog demo: foto referensi model, harga dan spesifikasi contoh. Mobil tidak untuk
          dijual.
        </p>
      )}
      <div className="catalog-results-heading mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow !mb-1">KATALOG KENDARAAN</p>
          <h2 className="text-base font-semibold">{list.length} mobil tersedia</h2>
        </div>
        <Link href="/simulasi" className="button-secondary">
          <Icon name="calculator" className="h-4 w-4" />
          Hitung cicilan
        </Link>
      </div>

      <div className="surface filter-bar buyer-search flex flex-col gap-3">
        <label htmlFor="catalog-search" className="text-sm font-semibold">
          Mobil apa yang kamu cari?
        </label>
        <div className="grid grid-cols-2 gap-3 md:flex md:flex-row">
          <div className="relative col-span-2 flex-1">
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
              id="catalog-search"
              aria-label="Cari merek, model, atau kota"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Contoh: Toyota Avanza atau Bandung"
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
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
          aria-controls="advanced-catalog-filters"
          className="button-secondary self-start catalog-advanced-toggle"
        >
          <Icon name="cog" className="h-3.5 w-3.5" />
          {advancedOpen ? "Tutup filter tambahan" : "Filter lainnya"}
        </button>
        <div
          id="advanced-catalog-filters"
          className={`advanced-filters ${advancedOpen ? "is-open" : ""}`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="discovery-brand" className="filter-label">
                Merek mobil
              </label>
              <select
                id="discovery-brand"
                value={brand}
                onChange={(e) => chooseBrand(e.target.value)}
                className={`${selectCls} w-full`}
              >
                <option value="all">Semua merek</option>
                {brand !== "all" && !brands.includes(brand) ? (
                  <option value={brand}>{brand}</option>
                ) : null}
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="discovery-model" className="filter-label">
                Model mobil
              </label>
              <select
                id="discovery-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={brand === "all"}
                className={`${selectCls} w-full disabled:opacity-50`}
              >
                <option value="all">
                  {brand === "all" ? "Pilih merek terlebih dahulu" : "Semua model"}
                </option>
                {model !== "all" && !models.includes(model) ? (
                  <option value={model}>{model}</option>
                ) : null}
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                const t = e.clipboardData.getData("text").replace(/[^\d]/g, "").slice(0, 4);
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
          <div className="catalog-price-options flex flex-wrap gap-2">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset filter
            </button>
          ) : null}
        </div>
      </div>

      <details className="catalog-browse-options mb-5 rounded-xl border border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">
          Pilih berdasarkan kebutuhan, merek, atau tipe{" "}
          <span className="ml-1 text-xs font-normal text-slate-500">(opsional)</span>
        </summary>
        <CarDiscovery
          cars={available}
          brand={brand}
          category={cat}
          group={group}
          onBrand={chooseBrand}
          onCategory={setCat}
          onGroup={setGroup}
          resultCount={list.length}
          onViewResults={() => {
            resultsRef.current?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
              block: "start",
            });
            resultsRef.current?.focus({ preventScroll: true });
          }}
        />
      </details>
      {activeFilters.length ? (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Kelompok aktif">
          <span className="text-[11px] text-slate-500">Dipilih:</span>
          {activeFilters.map((f, i) => (
            <button
              key={f.label + i}
              type="button"
              aria-label={`Hapus filter ${f.label}`}
              onClick={f.clear}
              className="active-discovery-chip"
            >
              {f.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={copySearch}
            className="ml-auto text-[11px] font-semibold text-sky-700 dark:text-sky-300"
          >
            Salin pencarian
          </button>
        </div>
      ) : null}
      <p
        ref={resultsRef}
        tabIndex={-1}
        aria-live="polite"
        className="scroll-mt-24 outline-none mb-4 text-xs text-slate-500"
      >
        Menampilkan <strong className="font-semibold">{list.length}</strong> dari {available.length}{" "}
        mobil aktif{activeGroup ? ` · ${activeGroup.label}` : ""}.
      </p>
      {list.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon="car"
            title={
              dirty ? "Belum menemukan yang cocok?" : "Pilihan berikutnya sedang dipersiapkan."
            }
            description={
              dirty
                ? "Coba rentang harga yang lebih luas, atau mulai kembali dengan semua kategori."
                : "Belum ada mobil yang ditayangkan pada browser ini. Sambil menunggu, kamu bisa merencanakan anggaran pembelian."
            }
          >
            {dirty ? (
              <button onClick={resetFilters} className="button-primary">
                Reset pencarian
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/simulasi" className="button-primary">
                  Rencanakan anggaran
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
                {["admin"].includes(role) ? (
                  <Link href="/jual" className="button-secondary">
                    Tambahkan listing
                  </Link>
                ) : null}
              </div>
            )}
          </EmptyState>
        </div>
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

      {role !== "admin" ? (
        <section className="surface discovery-help">
          <span className="soft-icon">
            <Icon name="chat" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Belum menemukan yang cocok?</h2>
            <p className="page-description !mt-1">
              Ceritakan kebutuhan dan anggaranmu kepada admin. Pesan dapat kamu tinjau sebelum
              dikirim.
            </p>
          </div>
          <Link
            href={
              role === "guest"
                ? "/login"
                : `/chat?pesan=${encodeURIComponent("Halo Admin, saya mencari mobil" + (searchSummary ? `: ${searchSummary}` : " sesuai kebutuhan saya") + ". Bisa bantu saya?")}`
            }
            className="button-primary"
          >
            Bantu cari mobil
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </section>
      ) : null}
      <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-gray-400">
        <Icon name="help" className="h-3.5 w-3.5 shrink-0" />
        Katalog saat ini menggunakan data pada browser ini. Listing belum tersinkron antarperangkat.
      </p>

      {detailId ? (
        <DetailModal
          carId={detailId}
          onClose={() => setDetailId(null)}
          onBuy={setBuyId}
          onOffer={setOfferId}
        />
      ) : null}
      {offerId ? <OfferModal carId={offerId} onClose={() => setOfferId(null)} /> : null}
      {buyId ? <CheckoutModal carId={buyId} onClose={() => setBuyId(null)} /> : null}
    </div>
  );
}
