"use client";
import { useState } from "react";
import { CAR_BRANDS, vehicleBrand, type DiscoverableCar } from "@/lib/vehicle-discovery";
import { BrandLogo, BodyShape } from "@/components/vehicle-icons";
import { CATEGORIES } from "@/lib/cities";

export function CarDiscovery({
  cars,
  brand,
  category,
  onBrand,
  onCategory,
}: {
  cars: DiscoverableCar[];
  brand: string;
  category: string;
  onBrand: (value: string) => void;
  onCategory: (value: string) => void;
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
    <section className="discovery-panel catalogue-discovery" aria-label="Merek dan tipe mobil">
      <div className="discovery-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Merek mobil</h3>
          <button
            type="button"
            aria-pressed={brand === "all"}
            onClick={() => onBrand("all")}
            className="catalogue-clear-choice"
          >
            {brand === "all" ? "Semua merek" : "Reset merek"}
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
          <h3 className="text-xs font-semibold">Tipe kendaraan</h3>
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
    </section>
  );
}
