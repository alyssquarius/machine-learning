"use client";
import { useState } from "react";
import { CAR_BRANDS, vehicleBrand, type DiscoverableCar } from "@/lib/vehicle-discovery";
import { BrandLogo } from "@/components/vehicle-icons";

export function CarDiscovery({
  cars,
  brand,
  onBrand,
}: {
  cars: DiscoverableCar[];
  brand: string;
  onBrand: (value: string) => void;
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
    <section className="discovery-panel catalogue-discovery" aria-label="Pilih merek mobil">
      <div className="discovery-section">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Merek mobil</h3>
        </div>
        <p className="catalogue-mobile-brand-hint">Geser untuk melihat merek lainnya.</p>
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
    </section>
  );
}
