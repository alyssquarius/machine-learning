export const CAR_BRANDS = [
  "Toyota",
  "Honda",
  "Suzuki",
  "Daihatsu",
  "Mitsubishi",
  "Nissan",
  "Hyundai",
  "Wuling",
  "Kia",
  "Mazda",
  "BMW",
  "Mercedes-Benz",
  "BYD",
  "Chery",
  "MG",
  "Ford",
  "Chevrolet",
  "Isuzu",
  "Lexus",
  "Peugeot",
  "Volkswagen",
  "Volvo",
  "Subaru",
  "Tesla",
] as const;
export type DiscoverableCar = {
  title: string;
  brand?: string;
  model?: string;
  category: string;
  price: number;
  km: number;
};
export const DISCOVERY_GROUPS = [
  { id: "family", label: "Mobil keluarga", description: "Tipe MPV & SUV", icon: "home" },
  {
    id: "budget",
    label: "Anggaran terjangkau",
    description: "Harga sampai Rp200 juta",
    icon: "tag",
  },
  { id: "low-km", label: "Kilometer rendah", description: "1–30.000 km tercatat", icon: "clock" },
  { id: "electric", label: "Mobil listrik", description: "Kategori listrik", icon: "car" },
] as const;
export type DiscoveryGroup = (typeof DISCOVERY_GROUPS)[number]["id"];
export function vehicleBrand(car: Pick<DiscoverableCar, "title" | "brand">): string {
  const raw = String(car.brand || "")
    .trim()
    .slice(0, 40);
  const alias = raw.toLowerCase() === "mercedes" ? "Mercedes-Benz" : raw;
  if (alias) return CAR_BRANDS.find((b) => b.toLowerCase() === alias.toLowerCase()) || alias;
  const title = car.title.trim().replace(/^(all\s+new|new)\s+/i, "");
  if (/^mercedes(?:\s|-|$)/i.test(title)) return "Mercedes-Benz";
  return (
    CAR_BRANDS.find(
      (b) =>
        title.toLowerCase().startsWith(b.toLowerCase() + " ") ||
        title.toLowerCase() === b.toLowerCase(),
    ) || "Lainnya"
  );
}
export function vehicleModel(car: Pick<DiscoverableCar, "title" | "brand" | "model">): string {
  if (car.model?.trim()) return car.model.trim().slice(0, 60);
  const brand = vehicleBrand(car);
  if (brand === "Lainnya") return "";
  const title = car.title.trim().replace(/^(all\s+new|new)\s+/i, "");
  const prefix =
    brand === "Mercedes-Benz"
      ? /^mercedes(?:[-\s]benz)?\s*/i
      : new RegExp("^" + brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i");
  if (!prefix.test(title)) return "";
  return title.replace(prefix, "").split(/\s+/)[0] || "";
}
export function matchesDiscovery(
  car: DiscoverableCar,
  filters: { brand?: string; model?: string; group?: string },
): boolean {
  if (
    filters.brand &&
    filters.brand !== "all" &&
    vehicleBrand(car).toLowerCase() !== filters.brand.toLowerCase()
  )
    return false;
  if (
    filters.model &&
    filters.model !== "all" &&
    vehicleModel(car).toLowerCase() !== filters.model.toLowerCase()
  )
    return false;
  switch (filters.group) {
    case "family":
      return ["MPV", "SUV"].includes(car.category);
    case "budget":
      return car.price > 0 && car.price <= 200000000;
    case "low-km":
      return car.km > 0 && car.km <= 30000;
    case "electric":
      return car.category === "Listrik";
    default:
      return true;
  }
}
