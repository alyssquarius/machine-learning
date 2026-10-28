"use client";
import { useState } from "react";
import { Icon } from "@/components/icons";
import {
  CAR_BRANDS,
  DISCOVERY_GROUPS,
  matchesDiscovery,
  vehicleBrand,
  type DiscoverableCar,
} from "@/lib/vehicle-discovery";
import { BrandLogo, BodyShape } from "@/components/vehicle-icons";
import { CATEGORIES } from "@/lib/cities";

export function CarDiscovery({
  cars,
  brand,
  category,
  group,
  onBrand,
  onCategory,
  onGroup,
  resultCount,
  onViewResults,
}: {
  cars: DiscoverableCar[];
  brand: string;
  category: string;
  group: string;
  onBrand: (value: string) => void;
  onCategory: (value: string) => void;
  onGroup: (value: string) => void;
  resultCount: number;
  onViewResults: () => void;
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const brands = [...new Set([...CAR_BRANDS, ...cars.map(vehicleBrand)])];
  const featured = [
    "Toyota",
    "Honda",
    "Suzuki",
    "Daihatsu",
    "Mitsubishi",
    "Nissan",
    "Hyundai",
    "Wuling",
  ];
  const extra = brands.filter(
    (b) => !featured.includes(b) && cars.some((c) => vehicleBrand(c) === b),
  );
  return (
    <section className="surface discovery-panel" aria-label="Jelajahi kelompok mobil">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Atau pilih sesuai kebutuhan</h2>
          <p className="page-description !mt-1">
            Pilihan ini opsional. Ketuk lagi untuk membatalkan.
          </p>
        </div>
        <span className="text-[10px] text-slate-500"></span>
      </div>
      <div className="discovery-groups">
        {DISCOVERY_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => onGroup(group === g.id ? "all" : g.id)}
            className="discovery-group"
          >
            <span className="soft-icon !h-8 !w-8">
              <Icon name={g.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <strong className="block text-xs font-semibold">{g.label}</strong>
              <small className="mt-1 block text-[10px] text-slate-500">{g.description}</small>
            </span>
            <span className="discovery-count">
              {cars.filter((c) => matchesDiscovery(c, { group: g.id })).length}
            </span>
          </button>
        ))}
      </div>
      <div className="discovery-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold">Berdasarkan merek</h3>
          <button
            type="button"
            aria-pressed={brand === "all"}
            onClick={() => onBrand("all")}
            className="text-[11px] text-sky-700 dark:text-sky-300"
          >
            Semua merek
          </button>
        </div>
        <div className="discovery-brands">
          {[...featured, ...extra.filter((b) => showAllBrands || b === brand)].map((b) => (
            <button
              type="button"
              key={b}
              aria-pressed={brand === b}
              onClick={() => onBrand(brand === b ? "all" : b)}
            >
              <BrandLogo brand={b} />
              <span>{b}</span>
              <small>{cars.filter((c) => vehicleBrand(c) === b).length}</small>
            </button>
          ))}
        </div>
        {extra.length > 0 && (
          <button
            type="button"
            aria-expanded={showAllBrands}
            onClick={() => setShowAllBrands(!showAllBrands)}
            className="mt-3 text-xs font-semibold text-sky-700 dark:text-sky-300"
          >
            {showAllBrands
              ? "Tampilkan lebih sedikit merek"
              : `Lihat ${extra.length} merek lainnya`}
          </button>
        )}
      </div>
      <details className="discovery-section" open={category !== "all" || undefined}>
        <summary className="cursor-pointer text-xs font-semibold">
          Pilih tipe mobil{" "}
          <span className="font-normal text-slate-500">(SUV, MPV, sedan, dan lainnya)</span>
        </summary>
        <div className="mb-2 mt-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold">Berdasarkan tipe</h3>
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => onCategory("all")}
            className="text-[11px] text-sky-700 dark:text-sky-300"
          >
            Semua tipe
          </button>
        </div>
        <div className="discovery-bodies">
          {CATEGORIES.filter((c) => c !== "Lainnya").map((c) => (
            <button
              type="button"
              key={c}
              aria-pressed={category === c}
              onClick={() => onCategory(category === c ? "all" : c)}
            >
              <BodyShape type={c} />
              <span>{c}</span>
              <small>{cars.filter((car) => car.category === c).length}</small>
            </button>
          ))}
        </div>
      </details>
      <div className="discovery-result-bar">
        <span className="text-xs text-slate-500">
          <strong className="font-semibold">{resultCount}</strong> mobil sesuai pilihan
        </span>
        <button type="button" className="button-primary" onClick={onViewResults}>
          Lihat {resultCount} mobil
          <Icon name="arrow" className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
