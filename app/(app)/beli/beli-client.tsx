"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";
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
  DISCOVERY_GROUPS,
  vehicleBrand,
  vehicleModel,
  matchesDiscovery,
} from "@/lib/vehicle-discovery";
import { PRICE_PRESETS, resolveBuyYearValue } from "@/lib/market";
import { RevealCard } from "@/components/reveal-card";
import {
  CAR_VIEWS_KEY,
  readCarViews,
  incrementCarView,
  recommendCars,
  sortByLocalInterest,
} from "@/lib/car-recommendations";
import { fmtRp } from "@/lib/format";
import { DemoPhotoCredit } from "@/components/demo-photo-credit";

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
  const helpRef = React.useRef<HTMLDetailsElement>(null);
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
  const [viewCounts, setViewCounts] = React.useState<Record<string, number>>({});
  const lastCountedDetail = React.useRef<string | null>(null);
  React.useEffect(() => {
    const sync = () => {
      try {
        setViewCounts(readCarViews(localStorage.getItem(CAR_VIEWS_KEY)));
      } catch {
        /* Recommendations remain available without storage. */
      }
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  React.useEffect(() => {
    if (!detailId) {
      lastCountedDetail.current = null;
      return;
    }
    if (!store.get(detailId) || lastCountedDetail.current === detailId) return;
    lastCountedDetail.current = detailId;
    let previous = viewCounts;
    try {
      previous = readCarViews(localStorage.getItem(CAR_VIEWS_KEY));
    } catch {
      /* Retain session counts. */
    }
    const next = incrementCarView(previous, detailId);
    try {
      localStorage.setItem(CAR_VIEWS_KEY, JSON.stringify(next));
    } catch {
      /* Counts are optional. */
    }
    setViewCounts(next);
  }, [detailId, store.ready]);
  const [pagination, setPagination] = React.useState({ key: "", count: 12, focusIndex: 0 });
  const revealedCarRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLParagraphElement>(null);
  const locTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const available = React.useMemo(
    () => store.all().filter((c) => c.status === "running"),
    [store.cars],
  );
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
    else if (sort === "love")
      out = sortByLocalInterest(
        out,
        viewCounts,
        store.favorites().map((car) => car.id),
      );
    else out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [available, brand, model, group, q, cat, sort, min, max, loc, year, viewCounts]);

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

  const paginationKey = JSON.stringify([q, brand, model, group, cat, sort, min, max, loc, year]);
  if (pagination.key !== paginationKey) {
    setPagination({ key: paginationKey, count: 12, focusIndex: 0 });
  }
  const visibleCount = pagination.key === paginationKey ? pagination.count : 12;
  const visibleCars = list.slice(0, visibleCount);
  const nextCount = Math.min(12, list.length - visibleCars.length);
  const suggestions = recommendCars(
    list,
    viewCounts,
    store.favorites().map((car) => car.id),
  );
  React.useEffect(() => {
    if (pagination.key === paginationKey && pagination.focusIndex > 0)
      revealedCarRef.current?.focus({ preventScroll: true });
  }, [pagination, paginationKey]);
  function viewResults() {
    resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    resultsRef.current?.focus({ preventScroll: true });
  }

  return (
    <div
      className={`catalogue-search-page ${role === "buyer" || role === "guest" ? "buyer-catalog" : ""}`}
    >
      <section className="hero-panel catalog-hero">
        <div className="catalog-intro">
          <h1>Cari mobil yang cocok untukmu.</h1>
          <p>Sesuaikan kebutuhan dan anggaran. Pilihan berikutnya dimulai di sini.</p>
          {list.length > 0 ? (
            <a className="catalogue-suggestion-link" href="#saran-mobil">
              Lihat saran mobil <span aria-hidden="true">↓</span>
            </a>
          ) : null}
        </div>
        <div className="catalog-hero-image">
          <Image
            src="/images/catalogue-road.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        </div>
      </section>
      <form
        className="surface filter-bar buyer-search flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          viewResults();
        }}
      >
        <div className="catalogue-filter-intro">
          <h2>Temukan mobil pilihanmu</h2>
          <p>Cukup isi yang kamu butuhkan. Hasil langsung mengikuti pilihanmu.</p>
        </div>
        <div className="catalogue-search-fields grid grid-cols-2 gap-3 md:flex md:flex-row">
          <div className="relative col-span-2 flex-1">
            <label htmlFor="catalog-search" className="catalogue-field-label">
              Nama mobil atau kota
            </label>
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
          <label className="catalog-select-field">
            <span>Tipe mobil</span>
            <select
              aria-label="Tipe mobil"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className={selectCls}
            >
              <option value="all">Semua tipe</option>
              {[...new Set([...CATEGORIES, ...cats])].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="button-primary catalogue-submit">
            <Icon name="search" className="h-4 w-4" />
            Cari mobil
          </button>
        </div>
        <div className="catalogue-budget-row" role="group" aria-label="Pilih anggaran mobil">
          <span className="catalogue-budget-label">Anggaran</span>
          <div className="catalog-price-options">
            {PRICE_PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => applyPreset(p.id)}
                aria-pressed={preset === p.id}
                className="filter-pill"
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="filter-pill"
            aria-pressed={preset === "custom"}
            onClick={() => setPreset("custom")}
          >
            Atur harga sendiri
          </button>
          {dirty ? (
            <button type="button" onClick={resetFilters} className="catalogue-reset">
              Reset filter
            </button>
          ) : null}
        </div>
        {preset === "custom" ? (
          <div className="catalogue-custom-budget">
            <label className="catalog-filter-field">
              <span>Harga minimum (Rp)</span>
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
            </label>
            <label className="catalog-filter-field">
              <span>Harga maksimum (Rp)</span>
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
            </label>

            {min !== "" && max !== "" && Number(min) > Number(max) ? (
              <p role="alert" className="catalog-filter-error">
                Harga maksimum harus sama atau lebih besar dari harga minimum.
              </p>
            ) : null}
          </div>
        ) : null}
        <CarDiscovery cars={available} brand={brand} onBrand={chooseBrand} />
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
          aria-controls="advanced-catalog-filters"
          className="button-secondary self-start catalog-advanced-toggle"
        >
          <Icon name="cog" className="h-3.5 w-3.5" />
          {advancedOpen ? "Tutup filter tambahan" : "Filter tambahan"}
          <span className="catalogue-disclosure-chevron" aria-hidden="true">
            ⌄
          </span>
        </button>
        <div
          className={`catalogue-advanced-shell ${advancedOpen ? "is-open" : ""}`}
          inert={!advancedOpen}
          aria-hidden={!advancedOpen}
        >
          <div className="catalogue-advanced-clip">
            <div id="advanced-catalog-filters" className="advanced-filters is-open">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <label className="catalog-filter-field">
                <span>Kota kendaraan</span>
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
              </label>
              <label className="catalog-filter-field">
                <span>Tahun kendaraan</span>
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
              </label>
            </div>
          </div>
        </div>
        <div className="catalogue-search-footer">
          <span>
            <Icon name="calculator" className="h-4 w-4" />
            Sudah punya anggaran?
          </span>
          <Link href="/simulasi">Hitung perkiraan cicilan</Link>
        </div>
      </form>

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
      {suggestions.cars.length > 0 ? (
        <section
          id="saran-mobil"
          className="catalogue-suggestions"
          aria-labelledby="suggestions-title"
        >
          <RevealCard className="catalogue-suggestions-heading">
            <div>
              <h2 id="suggestions-title">
                {suggestions.hasActivity ? "Mobil yang kamu minati" : "Saran untuk mulai mencari"}
              </h2>
              <p>
                {suggestions.hasActivity
                  ? "Favoritmu ditampilkan lebih dulu, lalu mobil yang paling sering kamu buka di browser ini."
                  : "Pilihan dari beberapa tipe mobil dalam hasil pencarian. Belum ada data minat di browser ini."}
              </p>
            </div>
          </RevealCard>
          <div className="catalogue-suggestions-grid">
            {suggestions.cars.map((car, index) => (
              <RevealCard key={car.id} delay={index * 70} className="catalogue-suggestion-item">
                <button
                  type="button"
                  className="catalogue-suggestion-button"
                  aria-label={`Lihat saran ${car.title}`}
                  onClick={() => setDetailId(car.id)}
                >
                  <img
                    src={car.image || imageFor(car.category)}
                    width={180}
                    height={130}
                    alt={car.title}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = imageFor(car.category);
                    }}
                  />
                  <span className="catalogue-suggestion-copy">
                    <small>{car.isDemo ? "Data demo" : car.category}</small>
                    <strong>{car.title}</strong>
                    <span>{fmtRp(car.price)}</span>
                    <small>
                      {viewCounts[car.id] > 0
                        ? `Dibuka ${viewCounts[car.id]} kali di browser ini`
                        : `${car.year} · ${car.category}`}
                    </small>
                  </span>
                </button>
                <DemoPhotoCredit car={car} />
              </RevealCard>
            ))}
          </div>
        </section>
      ) : null}
      <div
        id="pilihan-mobil"
        className="catalog-results-heading mb-5 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-base font-semibold">{list.length} mobil sesuai pilihanmu</h2>
          <p className="page-description">Buka foto untuk melihat spesifikasi dan detail mobil.</p>
        </div>
        <div className="catalogue-result-tools">
          <label className="catalog-select-field">
            <span>Urutkan</span>
            <select
              aria-label="Urutkan mobil"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={selectCls}
            >
              <option value="new">Terbaru</option>
              <option value="cheap">Termurah</option>
              <option value="exp">Termahal</option>
              <option value="love">Minat di browser</option>
            </select>
          </label>
          <span className="catalogue-result-count">
            {visibleCars.length} dari {list.length} mobil
          </span>
        </div>
      </div>
      {available.some((c) => c.isDemo) && (
        <p className="catalog-demo-note">
          Katalog demo: foto referensi model, harga dan spesifikasi contoh. Mobil tidak untuk
          dijual.
        </p>
      )}
      <p
        ref={resultsRef}
        tabIndex={-1}
        aria-live="polite"
        className="scroll-mt-24 outline-none mb-4 text-xs text-slate-500"
      >
        Menampilkan <strong className="font-semibold">{visibleCars.length}</strong> dari{" "}
        {list.length} hasil
        {activeGroup ? ` · ${activeGroup.label}` : ""}.
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
        <div
          id="catalogue-cars"
          className="catalogue-car-grid grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {visibleCars.map((c, index) => (
            <RevealCard
              key={c.id}
              delay={(index % 3) * 70}
              className="catalogue-car-item"
              focusRef={index === pagination.focusIndex ? revealedCarRef : undefined}
            >
              <CarCard
                car={{ ...c, image: c.image || imageFor(c.category) }}
                onDetail={setDetailId}
                onBuy={setBuyId}
                onOffer={setOfferId}
              />
            </RevealCard>
          ))}
        </div>
      )}
      {nextCount > 0 ? (
        <div className="catalogue-load-more">
          <p>Masih ada {list.length - visibleCars.length} mobil lainnya.</p>
          <button
            type="button"
            className="button-secondary"
            aria-controls="catalogue-cars"
            onClick={() =>
              setPagination({
                key: paginationKey,
                count: visibleCount + 12,
                focusIndex: visibleCars.length,
              })
            }
          >
            Lihat {nextCount} mobil berikutnya
          </button>
        </div>
      ) : list.length > 0 ? (
        <p className="catalogue-end-note">
          Semua {list.length} mobil sesuai pencarian sudah ditampilkan.
        </p>
      ) : null}

      {store.ready && role !== "admin" && !detailId && !buyId && !offerId
        ? createPortal(
            <details
              className="floating-car-help"
              ref={helpRef}
              onKeyDown={(event) => {
                if (event.key === "Escape" && helpRef.current?.open) {
                  helpRef.current.open = false;
                  helpRef.current.querySelector("summary")?.focus();
                }
              }}
            >
              <summary aria-label="Buka bantuan chat mobil">
                <Icon name="chat" className="h-6 w-6" />
                <span>Chat admin</span>
              </summary>
              <div
                className="floating-car-help-panel"
                role="region"
                aria-label="Bantuan mencari mobil"
              >
                <div className="floating-car-help-heading">
                  <h2>Butuh bantuan cari mobil?</h2>
                  <button
                    type="button"
                    aria-label="Tutup bantuan chat"
                    onClick={() => {
                      if (helpRef.current) {
                        helpRef.current.open = false;
                        helpRef.current.querySelector("summary")?.focus();
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
                <p>
                  Ceritakan kebutuhan dan anggaranmu kepada admin. Kamu bisa meninjau pesan sebelum
                  mengirimnya.
                </p>
                <Link
                  href={
                    role === "guest"
                      ? "/login"
                      : `/chat?pesan=${encodeURIComponent("Halo Admin, saya mencari mobil" + (searchSummary ? `: ${searchSummary}` : " sesuai kebutuhan saya") + ". Bisa bantu saya?")}`
                  }
                  className="button-primary"
                >
                  {role === "guest" ? "Masuk untuk chat" : "Mulai chat"}
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </details>,
            document.body,
          )
        : null}
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
