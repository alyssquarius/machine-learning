"use client";

import * as React from "react";
import { cleanCategory } from "@/lib/cities";
import { canPerformAction, hasPermission, type Role } from "@/lib/roles";
import { carPhotos } from "@/lib/car-photos";
import { safeImageUrl } from "@/lib/format";
import { seedDemoCatalog } from "@/lib/demo-cars";

export type CarStatus = "done" | "running" | "queued" | "failed";
export type OfferStatus = "pending" | "accepted" | "rejected";

export interface Offer {
  id: string;
  amount: number;
  note: string;
  ts: number;
  status: OfferStatus;
}

export interface Purchase {
  invoiceNumber: string;
  method: "tunai" | "kredit" | "tawar";
  paymentType?: "full" | "booking";
  bookingFee?: number;
  deliveryMethod?: "showroom" | "home_delivery" | "cod";
  address?: string;
  note?: string;
  dp: number;
  tenor: number;
  rate: number;
  installment: number;
  name: string;
  phone: string;
  sellerPhone?: string;
  ts: number;
}

export interface Car {
  photoCredit?: { author: string; source: string; license: string; licenseUrl: string };
  isDemo?: boolean;
  id: string;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  year: number;
  km: number;
  location: string;
  category: string;
  status: CarStatus;
  interest: number;
  badge: string;
  image: string;
  images?: string[];
  description: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  createdAt: number;
  offers: Offer[];
  purchase?: Purchase;
}

export interface HistEntry {
  id: string;
  type: "beli" | "jual" | "tawar" | "favorit" | "status" | "verifikasi" | "batal" | "hapus";
  text: string;
  ts: number;
  carId: string | null;
}

interface Settings {
  target: number;
  displayName: string;
  notifRead: number;
  hiddenWidgets: string[];
}

export interface Stats {
  total: number;
  active: number;
  sold: number;
  pending: number;
  favCount: number;
  activeValue: number;
}

const W = (n: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(n)}?width=800`;

const CATEGORY_IMAGES: Record<string, string> = {
  SUV: W("2015 Toyota Fortuner (New Zealand).jpg"),
  Sedan: W("Honda Civic e-HEV Sport (XI) – f 30062024.jpg"),
  MPV: W("2022 Toyota Avanza 1.5 G Toyota Safety Sense W101RE (20220403).jpg"),
  Hatchback: W("2014 Daihatsu Ayla 1.0 X B100RS (20190615).jpg"),
  Listrik: W("Hyundai Ioniq 5 AWD Techniq-Paket – f 31122024.jpg"),
  Lainnya: W("Honda CR-V e-HEV Elegance AWD (VI) – f 14072024.jpg"),
};

export function imageFor(category: string, explicit?: string): string {
  const url = safeImageUrl(explicit);
  if (url) return url;
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.Lainnya;
}

const LS_CARS = "abc_cars_v3";
const LS_SHARED_CARS = "abc_cars_shared_v2";
const LS_FAVS = "abc_favs_v2";
const LS_HIST = "abc_hist_v2";
const LS_SET = "abc_settings_v2";

const STATUSES: CarStatus[] = ["done", "running", "queued", "failed"];

function clone<T>(v: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(v);
  } catch {
    /* fallback */
  }
  return JSON.parse(JSON.stringify(v));
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    const val = JSON.parse(raw);
    return val === undefined ? clone(fallback) : (val as T);
  } catch {
    return clone(fallback);
  }
}

function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* mode privat / penyimpanan diblokir */
  }
}

function normalizeCars(arr: unknown): Car[] {
  if (!Array.isArray(arr)) return [];
  return (arr as Car[])
    .filter((c) => c && typeof c.id === "string")
    .map((c) => {
      const o: Car = { ...(c as Car) };
      o.isDemo = o.isDemo === true;
      o.title = String(o.title || "Mobil").slice(0, 80);
      o.brand = String(o.brand || "")
        .trim()
        .slice(0, 40);
      o.model = String(o.model || "")
        .trim()
        .slice(0, 60);
      o.price = Math.max(0, Number(o.price) || 0);
      const my = new Date().getFullYear();
      o.year = Math.min(my, Math.max(1990, Number(o.year) || my));
      o.km = Math.max(0, Number(o.km) || 0);
      o.location = String(o.location || "-").slice(0, 60) || "-";
      o.category = cleanCategory(o.category);
      o.status = STATUSES.includes(o.status) ? o.status : "queued";
      o.interest = Math.max(0, Math.min(100, Number(o.interest) || 0));
      o.badge = String(o.badge || "").slice(0, 24);
      o.images = carPhotos(o);
      o.image = o.images[0] || "";
      o.sellerId = typeof o.sellerId === "string" ? o.sellerId : "";
      o.sellerName = typeof o.sellerName === "string" ? o.sellerName.slice(0, 60) : "";
      o.sellerPhone = typeof o.sellerPhone === "string" ? o.sellerPhone.slice(0, 30) : "";
      o.description = typeof o.description === "string" ? o.description.slice(0, 500) : "";
      o.createdAt = Number(o.createdAt) > 0 ? Number(o.createdAt) : Date.now();
      o.offers = Array.isArray(o.offers)
        ? (o.offers as Offer[])
            .filter((x) => x && typeof x.id === "string")
            .map((x) => ({
              id: String(x.id),
              amount: Math.max(0, Number(x.amount) || 0),
              note: String(x.note || "").slice(0, 140),
              ts: Number(x.ts) > 0 ? Number(x.ts) : Date.now(),
              status: (["pending", "accepted", "rejected"] as OfferStatus[]).includes(x.status)
                ? x.status
                : "pending",
            }))
        : [];
      if (o.purchase && typeof o.purchase === "object") {
        const p = o.purchase as Partial<Purchase>;
        o.purchase = {
          invoiceNumber: String(p.invoiceNumber || `ABC-INV-${o.id}`).slice(0, 40),
          method: (["tunai", "kredit", "tawar"] as const).includes(p.method as "tunai")
            ? (p.method as Purchase["method"])
            : "tunai",
          paymentType: p.paymentType === "booking" ? "booking" : "full",
          bookingFee: Math.max(0, Number(p.bookingFee) || 0),
          deliveryMethod: (["showroom", "home_delivery", "cod"] as const).includes(
            p.deliveryMethod as "showroom",
          )
            ? (p.deliveryMethod as Purchase["deliveryMethod"])
            : "showroom",
          address: String(p.address || "").slice(0, 200),
          note: String(p.note || "").slice(0, 300),
          dp: Math.max(0, Number(p.dp) || 0),
          tenor: Math.max(0, Number(p.tenor) || 0),
          rate: Math.max(0, Math.min(30, Number(p.rate) || 0)),
          installment: Math.max(0, Number(p.installment) || 0),
          name: String(p.name || "").slice(0, 60),
          phone: String(p.phone || "").slice(0, 30),
          sellerPhone: String(p.sellerPhone || o.sellerPhone || "").slice(0, 30),
          ts: Number(p.ts) > 0 ? Number(p.ts) : Date.now(),
        };
      } else {
        delete o.purchase;
      }
      return o;
    });
}

function normalizeHist(arr: unknown): HistEntry[] {
  if (!Array.isArray(arr)) return [];
  return (arr as HistEntry[])
    .filter((h) => h && typeof h.text === "string")
    .map((h) => ({
      ...h,
      text: String(h.text).replace(/<(?!b>|\/b>)/gi, "&lt;"),
    }));
}

function normalizeSettings(v: unknown): Settings {
  if (!v || typeof v !== "object" || Array.isArray(v))
    return { target: 10, displayName: "", notifRead: 0, hiddenWidgets: [] };
  const s = v as Partial<Settings>;
  return {
    target: Math.max(1, Math.min(100, Math.round(Number(s.target) || 10))),
    displayName: String(s.displayName || "").slice(0, 40),
    notifRead: Number(s.notifRead) || 0,
    hiddenWidgets: Array.isArray(s.hiddenWidgets) ? [...s.hiddenWidgets] : [],
  };
}

interface Snapshot {
  cars: Car[];
  favs: string[];
  hist: HistEntry[];
  settings: Settings;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

interface StoreApi {
  ready: boolean;
  cars: Car[];
  all(): Car[];
  inventory(): Car[];
  get(id: string): Car | undefined;
  history(): HistEntry[];
  stats(): Stats;
  categoryDist(): { label: string; pct: number }[];
  popular(limit?: number): Car[];
  isFav(id: string): boolean;
  favorites(): Car[];
  offersFor(id: string): Offer[];
  bestOffer(id: string): Offer | null;
  pendingOffersCount(): number;
  totalRevenue(): number;
  soldThisMonth(): number;
  soldEvents(): number[];
  listedEvents(): number[];
  getTarget(): number;
  getHiddenWidgets(): string[];
  isWidgetHidden(id: string): boolean;
  getDisplayName(): string;
  getNotifRead(): number;
  unreadCount(): number;
  exportHistoryCSV(): string;
  owner(): string;
  makeOffer(id: string, amount: number, note?: string): Offer | null;
  decideOffer(id: string, offerId: string, accept: boolean): Offer | null;
  toggleFav(id: string): boolean;
  add(data: Partial<Car> & { title: string; price: number; year: number }): Car | null;
  update(id: string, patch: Partial<Car>): Car | null;
  remove(id: string): boolean;
  setStatus(id: string, status: CarStatus): Car | null;
  edit(id: string, data: Partial<Car>): Car | null;
  buy(
    id: string,
    opts?: {
      method?: "tunai" | "kredit";
      paymentType?: "full" | "booking";
      bookingFee?: number;
      deliveryMethod?: "showroom" | "home_delivery" | "cod";
      address?: string;
      note?: string;
      dp?: number;
      tenor?: number;
      rate?: number;
      installment?: number;
      name?: string;
      phone?: string;
    },
  ): Purchase | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(type: string, text: string, silent?: boolean, carId?: string | null): void;
  setTarget(n: number): number;
  setWidgetHidden(id: string, hidden: boolean): void;
  toggleWidget(id: string): boolean;
  showAllWidgets(): void;
  setDisplayName(n: string): string;
  markNotifsRead(): void;
  clearHistory(): void;
  reset(): void;
  setOwner(id: string, role?: Role): string;
  duplicate(id: string): Car | null;
  clearFavs(): number;
}

const StoreCtx = React.createContext<StoreApi | null>(null);

export function useStore(): StoreApi {
  const ctx = React.useContext(StoreCtx);
  if (!ctx) throw new Error("useStore harus dipakai di dalam <StoreProvider>");
  return ctx;
}

// Optional hook yang aman di luar provider (untuk komponen shell).
export function useStoreOptional(): StoreApi | null {
  return React.useContext(StoreCtx);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ownerRef = React.useRef("");
  const roleRef = React.useRef<Role>("guest");
  const [snap, setSnap] = React.useState<Snapshot>({
    cars: [],
    favs: [],
    hist: [],
    settings: { target: 10, displayName: "", notifRead: 0, hiddenWidgets: [] },
  });
  const [ready, setReady] = React.useState(false);
  const snapRef = React.useRef(snap);
  snapRef.current = snap;

  const scoped = React.useCallback(
    (base: string) => (ownerRef.current ? `${base}_${ownerRef.current}` : base),
    [],
  );

  const persist = React.useCallback(
    (next: Snapshot) => {
      save(scoped(LS_CARS), next.cars);
      save(scoped(LS_FAVS), next.favs);
      save(scoped(LS_HIST), next.hist.slice(0, 60));
      save(scoped(LS_SET), next.settings);

      // Sinkronkan mobil ke katalog bersama agar tampil di katalog pembeli
      try {
        const currentShared = normalizeCars(load(LS_SHARED_CARS, []));
        const sharedMap = new Map(currentShared.map((c) => [c.id, c]));

        // Lindungi status & purchase data dari katalog bersama agar tidak tertimpa data lokal usang
        const mergedCars = next.cars.map((c) => {
          const sc = sharedMap.get(c.id);
          if (sc && sc.purchase && !c.purchase) {
            return {
              ...c,
              status: sc.status,
              badge: sc.badge || (sc.status === "done" ? "Terjual" : c.badge),
              purchase: sc.purchase,
            };
          }
          return c;
        });

        const currentOwnerIds = new Set(mergedCars.map((c) => c.id));
        const otherCars = currentShared.filter((c) => !currentOwnerIds.has(c.id));
        const updatedShared = [...mergedCars, ...otherCars];
        save(LS_SHARED_CARS, updatedShared);
      } catch {
        /* abaikan */
      }

      snapRef.current = next;
      setSnap({ ...next, cars: [...next.cars] });
    },
    [scoped],
  );

  const loadForOwner = React.useCallback((ownerId: string) => {
    try {
      seedDemoCatalog(localStorage);
    } catch {
      /* storage unavailable; preserve existing catalogue */
    }
    const k = (b: string) => (ownerId ? `${b}_${ownerId}` : b);
    let cars = normalizeCars(load(k(LS_CARS), []));
    let hist = normalizeHist(load(k(LS_HIST), []));

    // Gabungkan dengan katalog mobil bersama (shared marketplace)
    try {
      const sharedCars = normalizeCars(load(LS_SHARED_CARS, []));
      const sharedMap = new Map(sharedCars.map((c) => [c.id, c]));

      // Sinkronkan mobil lokal penjual jika sudah dibeli oleh pembeli lain di shared marketplace
      let localCarsChanged = false;
      cars = cars.map((localCar) => {
        const sc = sharedMap.get(localCar.id);
        if (sc && JSON.stringify(sc) !== JSON.stringify(localCar)) {
          localCarsChanged = true;
          return sc;
        }
        return localCar;
      });

      if (localCarsChanged) {
        save(k(LS_CARS), cars);
      }

      const seen = new Set(cars.map((c) => c.id));
      for (const sc of sharedCars) {
        if (!seen.has(sc.id)) {
          cars.push(sc);
          seen.add(sc.id);
        }
      }

      // Cek jika ada mobil milik penjual ini yang sudah dibeli pembeli tapi belum masuk notifikasi riwayat
      if (ownerId) {
        let histChanged = false;
        cars.forEach((c) => {
          if (c.sellerId === ownerId && c.purchase && c.status === "done") {
            const p = c.purchase;
            const alreadyNotified = hist.some(
              (h) => h.carId === c.id && h.text.includes(p.invoiceNumber),
            );
            if (!alreadyNotified) {
              hist.unshift({
                id: uid("h"),
                type: "beli",
                text:
                  p.paymentType === "booking"
                    ? `<b>PESANAN MASUK:</b> Mobil <b>${esc(c.title)}</b> dibooking oleh <b>${esc(p.name)}</b> (WA: ${p.phone}). Tanda Jadi: Rp ${(p.bookingFee || 0).toLocaleString("id-ID")}. Invoice <b>#${p.invoiceNumber}</b>.`
                    : p.method === "kredit"
                      ? `<b>PENGAJUAN KREDIT:</b> Mobil <b>${esc(c.title)}</b> diajukan kredit oleh <b>${esc(p.name)}</b> (WA: ${p.phone}). DP: Rp ${p.dp.toLocaleString("id-ID")}, Tenor: ${p.tenor} bln. Invoice <b>#${p.invoiceNumber}</b>.`
                      : `<b>MOBIL TERJUAL:</b> Mobil <b>${esc(c.title)}</b> dibeli tunai oleh <b>${esc(p.name)}</b> (WA: ${p.phone}) seharga Rp ${c.price.toLocaleString("id-ID")}. Invoice <b>#${p.invoiceNumber}</b>.`,
                ts: p.ts || Date.now(),
                carId: c.id,
              });
              histChanged = true;
            }
          }
        });
        if (histChanged) {
          hist = hist.slice(0, 60);
          save(k(LS_HIST), hist);
        }
      }
    } catch {
      /* abaikan */
    }

    let favs = load<string[]>(k(LS_FAVS), []);
    if (!Array.isArray(favs)) favs = [];
    const settings = normalizeSettings(load(k(LS_SET), {}));
    favs = favs.filter((id) => cars.some((c) => c.id === id));
    return { cars, favs, hist, settings };
  }, []);

  // Muat data default (tanpa owner) saat mount agar SSR aman.
  React.useEffect(() => {
    setSnap(loadForOwner(""));
    setReady(true);
  }, [loadForOwner]);

  // Sinkronisasi realtime lintas tab / sesi (StorageEvent & CustomEvent)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === LS_SHARED_CARS ||
        e.key === "abc_order_broadcast" ||
        (e.key && (e.key.startsWith(LS_CARS) || e.key.startsWith(LS_HIST)))
      ) {
        setSnap(loadForOwner(ownerRef.current));
      }
    };
    const handleOrderEvent = () => {
      setSnap(loadForOwner(ownerRef.current));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("order-created", handleOrderEvent);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("order-created", handleOrderEvent);
    };
  }, [loadForOwner]);

  const api: StoreApi = React.useMemo(() => {
    const cur = () => snapRef.current;
    const latestSnapshot = () => {
      const snapshot = clone(cur());
      const shared = normalizeCars(load(LS_SHARED_CARS, []));
      const cars = new Map(snapshot.cars.map((car) => [car.id, car]));
      shared.forEach((car) => cars.set(car.id, car));
      snapshot.cars = [...cars.values()];
      return snapshot;
    };
    const inventory = () =>
      cur().cars.filter(
        (car) =>
          roleRef.current === "admin" || (!!ownerRef.current && car.sellerId === ownerRef.current),
      );
    const canMutateListing = (
      car: Car,
      action: "canEditOwnListing" | "canDeleteOwnListing" | "canAcceptOffer" | "canRejectOffer",
    ) =>
      !!ownerRef.current &&
      canPerformAction(roleRef.current, action, { isOwner: car.sellerId === ownerRef.current });
    const mutate = (fn: (s: Snapshot) => Snapshot, opts?: { silentHist?: boolean }) => {
      const next = fn(latestSnapshot());
      void opts;
      persist(next);
    };

    return {
      ready,
      cars: snap.cars,
      all() {
        return [...cur().cars].sort((a, b) => b.createdAt - a.createdAt);
      },
      inventory() {
        return inventory().sort((a, b) => b.createdAt - a.createdAt);
      },
      get(id) {
        return cur().cars.find((c) => c.id === id);
      },
      history() {
        return [...cur().hist].sort((a, b) => b.ts - a.ts);
      },
      stats(): Stats {
        const cars = inventory();
        const favs = cur().favs;
        return {
          total: cars.length,
          active: cars.filter((c) => c.status === "running").length,
          sold: cars.filter((c) => c.status === "done").length,
          pending: cars.filter((c) => c.status === "queued").length,
          favCount: favs.filter((id) => cur().cars.some((c) => c.id === id)).length,
          activeValue: cars
            .filter((c) => c.status === "running")
            .reduce((a, c) => a + (c.price || 0), 0),
        };
      },
      categoryDist() {
        const cars = inventory();
        const cats: Record<string, number> = {};
        cars.forEach((c) => {
          cats[c.category || "Lainnya"] = (cats[c.category || "Lainnya"] || 0) + 1;
        });
        const total = cars.length || 1;
        return Object.entries(cats)
          .map(([label, n]) => ({ label, pct: Math.round((n / total) * 100) }))
          .sort((a, b) => b.pct - a.pct);
      },
      popular(limit = 3) {
        return [...inventory()]
          .sort((a, b) => (b.interest || 0) - (a.interest || 0))
          .slice(0, limit);
      },
      isFav(id) {
        return cur().favs.includes(id);
      },
      favorites() {
        const { cars, favs } = cur();
        return favs.map((id) => cars.find((c) => c.id === id)).filter((c): c is Car => Boolean(c));
      },
      offersFor(id) {
        const car = cur().cars.find((c) => c.id === id);
        return (((car && car.offers) || []) as Offer[]).slice().sort((a, b) => b.ts - a.ts);
      },
      bestOffer(id) {
        const list = this.offersFor(id).filter((o) => o.status === "pending");
        if (!list.length) return null;
        return list.reduce((a, b) => (b.amount > a.amount ? b : a));
      },
      pendingOffersCount() {
        return inventory().reduce(
          (a, c) => a + (c.offers || []).filter((o) => o.status === "pending").length,
          0,
        );
      },
      totalRevenue() {
        return inventory()
          .filter((c) => c.status === "done")
          .reduce((a, c) => a + (Number(c.price) || 0), 0);
      },
      soldThisMonth() {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        return this.soldEvents().filter((ts) => ts >= start).length;
      },
      soldEvents() {
        return inventory()
          .filter((c) => c.status === "done")
          .map((c) => (c.purchase && c.purchase.ts) || c.createdAt)
          .filter((ts) => ts > 0)
          .sort((a, b) => a - b);
      },
      listedEvents() {
        return inventory()
          .map((c) => c.createdAt)
          .filter((ts) => ts > 0)
          .sort((a, b) => a - b);
      },
      getTarget() {
        try {
          return Number(cur().settings.target) || 10;
        } catch {
          return 10;
        }
      },
      getHiddenWidgets() {
        try {
          return Array.isArray(cur().settings.hiddenWidgets)
            ? [...cur().settings.hiddenWidgets]
            : [];
        } catch {
          return [];
        }
      },
      isWidgetHidden(id) {
        try {
          return (cur().settings.hiddenWidgets || []).includes(id);
        } catch {
          return false;
        }
      },
      getDisplayName() {
        try {
          return (cur().settings.displayName || "").trim();
        } catch {
          return "";
        }
      },
      getNotifRead() {
        try {
          return Number(cur().settings.notifRead) || 0;
        } catch {
          return 0;
        }
      },
      unreadCount() {
        const s = cur();
        if (!s.hist.length) return 0;
        return s.hist.filter((h) => h.ts > (Number(s.settings.notifRead) || 0)).length;
      },
      exportHistoryCSV() {
        const q = (v: unknown) => {
          const value = String(v ?? "");
          const safe = /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
          return `"${safe.replace(/"/g, '""')}"`;
        };
        const rows: string[][] = [["waktu", "tipe", "teks"]];
        this.history().forEach((h) => {
          rows.push([
            new Date(h.ts).toLocaleString("id-ID"),
            h.type,
            String(h.text ?? "").replace(/<[^>]+>/g, ""),
          ]);
        });
        return rows.map((r) => r.map(q).join(",")).join("\n");
      },
      owner() {
        return ownerRef.current;
      },
      makeOffer(id, amount, note) {
        if (!ownerRef.current || !hasPermission(roleRef.current, "canMakeOffer")) return null;
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (!car || car.status !== "running") return null;
        const val = Number(amount) || 0;
        if (val < 1000000) return null;
        car.offers = car.offers || [];
        const offer: Offer = {
          id: uid("o"),
          amount: val,
          note: (note || "").trim().slice(0, 140),
          ts: Date.now(),
          status: "pending",
        };
        car.offers.unshift(offer);
        car.interest = Math.max(0, Math.min(100, (car.interest || 50) + 1));
        s.hist.unshift({
          id: uid("h"),
          type: "tawar",
          text: `Penawaran Rp ${val.toLocaleString("id-ID")} untuk <b>${esc(car.title)}</b>`,
          ts: Date.now(),
          carId: car.id,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return offer;
      },
      decideOffer(id, offerId, accept) {
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (car && !canMutateListing(car, accept ? "canAcceptOffer" : "canRejectOffer"))
          return null;
        if (!car || !car.offers) return null;
        if (car.status === "done") return null;
        const offer = car.offers.find((o) => o.id === offerId);
        if (!offer || offer.status !== "pending") return null;
        offer.status = accept ? "accepted" : "rejected";
        if (accept) {
          car.offers.forEach((o) => {
            if (o.id !== offer.id && o.status === "pending") o.status = "rejected";
          });
          car.price = offer.amount;
          car.status = "done";
          car.badge = "Terjual";
          car.purchase = {
            invoiceNumber: `ABC-INV-TWR-${Date.now().toString(36).toUpperCase()}`,
            method: "tawar",
            dp: 0,
            tenor: 0,
            rate: 0,
            installment: 0,
            name: (offer.note || "").trim().slice(0, 60),
            phone: "",
            sellerPhone: car.sellerPhone || "",
            ts: Date.now(),
          };
          s.hist.unshift({
            id: uid("h"),
            type: "beli",
            text: `Penawaran Rp ${offer.amount.toLocaleString("id-ID")} untuk <b>${esc(car.title)}</b> diterima`,
            ts: Date.now(),
            carId: car.id,
          });
        } else {
          s.hist.unshift({
            id: uid("h"),
            type: "batal",
            text: `Penawaran Rp ${offer.amount.toLocaleString("id-ID")} untuk <b>${esc(car.title)}</b> ditolak`,
            ts: Date.now(),
            carId: car.id,
          });
        }
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return offer;
      },
      toggleFav(id) {
        if (!ownerRef.current) return false;
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (!car) return false;
        const on = !s.favs.includes(id);
        s.favs = on ? [...s.favs, id] : s.favs.filter((f) => f !== id);
        car.interest = Math.max(0, Math.min(100, (car.interest || 50) + (on ? 1 : -1)));
        s.hist.unshift({
          id: uid("h"),
          type: "favorit",
          text: on
            ? `Mobil <b>${esc(car.title)}</b> ditambahkan ke favorit`
            : `Mobil <b>${esc(car.title)}</b> dihapus dari favorit`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return on;
      },
      add(data) {
        if (!ownerRef.current || !hasPermission(roleRef.current, "canCreateListing")) return null;
        const s = latestSnapshot();
        const category = cleanCategory(data.category, "SUV");
        const maxYear = new Date().getFullYear();
        const yearNum = Math.min(maxYear, Math.max(1990, Number(data.year) || maxYear));
        const status: CarStatus =
          data.status && STATUSES.includes(data.status) ? data.status : "running";
        const car: Car = {
          id: uid("c"),
          title: String(data.title || "")
            .trim()
            .slice(0, 80),
          brand: String(data.brand || "")
            .trim()
            .slice(0, 40),
          model: String(data.model || "")
            .trim()
            .slice(0, 60),
          price: Math.max(0, Number(data.price) || 0),
          year: yearNum,
          km: Math.max(0, Number(data.km) || 0),
          location: String(data.location || "-").slice(0, 60) || "-",
          category,
          status,
          interest: 50,
          badge: status === "running" ? "Dijual" : "Baru",
          image: carPhotos(data)[0] || imageFor(category, data.image),
          images: carPhotos(data),
          description: String(data.description || "")
            .trim()
            .slice(0, 500),
          sellerId: ownerRef.current,
          sellerName: String(data.sellerName || cur().settings.displayName || "")
            .trim()
            .slice(0, 60),
          sellerPhone: String(data.sellerPhone || "").trim(),
          createdAt: Date.now(),
          offers: [],
        };
        s.cars.unshift(car);
        s.hist.unshift({
          id: uid("h"),
          type: "jual",
          text:
            status === "running"
              ? `Mobil baru <b>${esc(car.title)}</b> berhasil ditayangkan di katalog pembeli`
              : `Mobil baru <b>${esc(car.title)}</b> ditambahkan, menunggu verifikasi`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return car;
      },
      update(id, patch) {
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (car && !canMutateListing(car, "canEditOwnListing")) return null;
        if (!car) return null;
        if (car.purchase && patch.status && patch.status !== "done") return null;
        const allowed = [
          "brand",
          "model",
          "title",
          "price",
          "year",
          "km",
          "location",
          "category",
          "status",
          "badge",
          "image",
          "images",
          "description",
          "interest",
        ];
        const clean: Partial<Car> = {};
        Object.keys(patch || {}).forEach((k) => {
          if (allowed.includes(k))
            (clean as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k];
        });
        if (typeof clean.brand === "string") clean.brand = clean.brand.trim().slice(0, 40);
        if (typeof clean.model === "string") clean.model = clean.model.trim().slice(0, 60);
        if (typeof clean.title === "string") clean.title = clean.title.trim().slice(0, 80);
        if (clean.price != null) clean.price = Math.max(0, Number(clean.price) || 0);
        if (clean.year != null) {
          const my = new Date().getFullYear();
          clean.year = Math.min(my, Math.max(1990, Number(clean.year) || my));
        }
        if (clean.km != null) clean.km = Math.max(0, Number(clean.km) || 0);
        if (typeof clean.location === "string")
          clean.location = clean.location.trim().slice(0, 60) || "-";
        if (typeof clean.description === "string")
          clean.description = clean.description.trim().slice(0, 500);
        if (typeof clean.image === "string") {
          const t = clean.image.trim();
          if (!t) clean.image = "";
          else {
            const img = safeImageUrl(t);
            if (img) clean.image = img;
            else delete clean.image;
          }
        }
        if (typeof clean.badge === "string") clean.badge = clean.badge.trim().slice(0, 24);
        if (clean.status != null && !STATUSES.includes(clean.status)) delete clean.status;
        if (clean.interest != null)
          clean.interest = Math.max(0, Math.min(100, Number(clean.interest) || 0));
        if (Array.isArray(clean.images)) {
          clean.images = carPhotos({ images: clean.images });
          clean.image = clean.images[0] || imageFor(clean.category || car.category);
        }
        Object.assign(car, clean);
        persist(s);
        return car;
      },
      remove(id) {
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (car && !canMutateListing(car, "canDeleteOwnListing")) return false;
        if (!car) return false;
        s.cars = s.cars.filter((c) => c.id !== id);
        s.favs = s.favs.filter((f) => f !== id);
        try {
          const currentShared = normalizeCars(load(LS_SHARED_CARS, []));
          save(
            LS_SHARED_CARS,
            currentShared.filter((c) => c.id !== id),
          );
        } catch {
          /* abaikan */
        }
        s.hist.unshift({
          id: uid("h"),
          type: "hapus",
          text: `Listing <b>${esc(car.title)}</b> dihapus`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return true;
      },
      setStatus(id, status) {
        if (!STATUSES.includes(status)) return null;
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (car && !canMutateListing(car, "canEditOwnListing")) return null;
        if (!car) return null;
        if (car.purchase && status && status !== "done") return null;
        car.status = status;
        if (status === "running") car.badge = "Dijual";
        const label =
          (
            {
              done: "terjual",
              running: "ditayangkan",
              queued: "menunggu verifikasi",
              failed: "ditolak",
            } as Record<string, string>
          )[status] || status;
        s.hist.unshift({
          id: uid("h"),
          type: "status",
          text: `Mobil <b>${esc(car.title)}</b> ${label}`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return car;
      },
      edit(id, data) {
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (car && !canMutateListing(car, "canEditOwnListing")) return null;
        if (!car) return null;
        if (car.purchase && data.status && data.status !== "done") return null;
        const title = String(data.title || "")
          .trim()
          .slice(0, 80);
        const price = Number(data.price) || 0;
        const year = Number(data.year) || car.year;
        const maxYear = new Date().getFullYear();
        if (title.length < 4 || !price || price < 1000000 || !year || year < 1990 || year > maxYear)
          return null;
        car.title = title;
        if (data.brand !== undefined)
          car.brand = String(data.brand || "")
            .trim()
            .slice(0, 40);
        if (data.model !== undefined)
          car.model = String(data.model || "")
            .trim()
            .slice(0, 60);
        car.price = price;
        car.year = year;
        car.km = Math.max(0, Number(data.km) || 0);
        car.location =
          String(data.location || "")
            .trim()
            .slice(0, 60) || "-";
        car.category = cleanCategory(data.category, car.category as never);
        if (data.status && STATUSES.includes(data.status)) {
          car.status = data.status;
          car.badge = car.status === "running" ? "Dijual" : "Baru";
        }
        if (data.sellerPhone !== undefined) {
          car.sellerPhone = String(data.sellerPhone || "").trim();
        }
        if (Object.prototype.hasOwnProperty.call(data, "image")) {
          const img = safeImageUrl(data.image);
          if (img) car.image = img;
        }
        if (Array.isArray(data.images)) {
          car.images = carPhotos({ images: data.images });
          car.image = car.images[0] || imageFor(car.category);
        }
        car.description = String(data.description || "")
          .trim()
          .slice(0, 500);
        s.hist.unshift({
          id: uid("h"),
          type: "jual",
          text: `Listing <b>${esc(car.title)}</b> diperbarui`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return car;
      },
      buy(id, opts = {}) {
        if (!ownerRef.current || !hasPermission(roleRef.current, "canBuyCar")) return null;
        const s = latestSnapshot();
        const car = s.cars.find((c) => c.id === id);
        if (!car || car.status !== "running") return null;
        car.status = "done";
        car.badge = "Terjual";
        const method = opts.method === "kredit" ? "kredit" : "tunai";
        const now = Date.now();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randStr = Math.floor(1000 + Math.random() * 9000);
        const invoiceNumber = `ABC-INV-${dateStr}-${randStr}`;

        const purchaseData: Purchase = {
          invoiceNumber,
          method,
          paymentType: opts.paymentType === "booking" ? "booking" : "full",
          bookingFee: Math.max(0, Number(opts.bookingFee) || 0),
          deliveryMethod: opts.deliveryMethod || "showroom",
          address: String(opts.address || "")
            .trim()
            .slice(0, 200),
          note: String(opts.note || "")
            .trim()
            .slice(0, 300),
          dp: Math.max(0, Number(opts.dp) || 0),
          tenor: Math.max(0, Number(opts.tenor) || 0),
          rate: Math.max(0, Number(opts.rate) || 0),
          installment: Math.max(0, Number(opts.installment) || 0),
          name: String(opts.name || "")
            .trim()
            .slice(0, 60),
          phone: String(opts.phone || "")
            .trim()
            .slice(0, 30),
          sellerPhone: String(car.sellerPhone || "").trim(),
          ts: now,
        };
        car.purchase = purchaseData;

        const paymentDesc =
          purchaseData.paymentType === "booking"
            ? `Tanda Jadi (Booking) Rp ${(purchaseData.bookingFee || 0).toLocaleString("id-ID")}`
            : method === "kredit"
              ? `Kredit: DP Rp ${purchaseData.dp.toLocaleString("id-ID")}, ${purchaseData.tenor}× Rp ${purchaseData.installment.toLocaleString("id-ID")}/bln`
              : `Tunai Penuh (Rp ${car.price.toLocaleString("id-ID")})`;

        s.hist.unshift({
          id: uid("h"),
          type: "beli",
          text: `Invoice <b>#${invoiceNumber}</b>: Pembelian mobil <b>${esc(car.title)}</b> oleh <b>${esc(purchaseData.name)}</b> (${paymentDesc})`,
          ts: now,
          carId: car.id,
        });
        s.hist = s.hist.slice(0, 60);

        try {
          const currentShared = normalizeCars(load(LS_SHARED_CARS, []));
          const idx = currentShared.findIndex((c) => c.id === car.id);
          if (idx !== -1) {
            currentShared[idx].status = "done";
            currentShared[idx].badge = "Terjual";
            currentShared[idx].purchase = purchaseData;
          } else {
            currentShared.unshift(car);
          }
          save(LS_SHARED_CARS, currentShared);
        } catch {
          /* abaikan */
        }

        // Teks notifikasi khusus untuk akun Penjual pemilik mobil
        const sellerNotifText =
          purchaseData.paymentType === "booking"
            ? `<b>PESANAN MASUK!</b> Mobil <b>${esc(car.title)}</b> dibooking oleh <b>${esc(purchaseData.name)}</b> (WA: ${purchaseData.phone}). Tanda Jadi: Rp ${(purchaseData.bookingFee || 0).toLocaleString("id-ID")}. Invoice <b>#${invoiceNumber}</b>.`
            : method === "kredit"
              ? `<b>PENGAJUAN KREDIT!</b> Mobil <b>${esc(car.title)}</b> diajukan kredit oleh <b>${esc(purchaseData.name)}</b> (WA: ${purchaseData.phone}). DP: Rp ${purchaseData.dp.toLocaleString("id-ID")}, Tenor: ${purchaseData.tenor} bln. Invoice <b>#${invoiceNumber}</b>.`
              : `<b>MOBIL TERJUAL!</b> Mobil <b>${esc(car.title)}</b> berhasil dibeli tunai oleh <b>${esc(purchaseData.name)}</b> (WA: ${purchaseData.phone}) seharga Rp ${car.price.toLocaleString("id-ID")}. Invoice <b>#${invoiceNumber}</b>.`;

        // 3. Masukkan transaksi & notifikasi ke SEMUA akun Penjual pemilik mobil (cross-account)
        try {
          const currentScopedKey = scoped(LS_CARS);
          const targetSellerId = car.sellerId;

          if (typeof window !== "undefined" && window.localStorage) {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (!k || !k.startsWith(LS_CARS)) continue;
              if (k === currentScopedKey) continue; // Akun pembeli saat ini disimpan oleh persist(s)

              const isMatchedSeller = targetSellerId && k === `${LS_CARS}_${targetSellerId}`;
              const sellerCars = normalizeCars(load(k, []));
              const cIdx = sellerCars.findIndex((sc) => sc.id === car.id);

              if (isMatchedSeller || cIdx !== -1) {
                if (cIdx !== -1) {
                  sellerCars[cIdx].status = "done";
                  sellerCars[cIdx].badge = "Terjual";
                  sellerCars[cIdx].purchase = purchaseData;
                  save(k, sellerCars);
                }

                const sellerOwnerId = k.replace(`${LS_CARS}_`, "");
                const histKey = sellerOwnerId ? `${LS_HIST}_${sellerOwnerId}` : LS_HIST;
                const sellerHist = normalizeHist(load(histKey, []));
                sellerHist.unshift({
                  id: uid("h"),
                  type: "beli",
                  text: sellerNotifText,
                  ts: now,
                  carId: car.id,
                });
                save(histKey, sellerHist.slice(0, 60));
              }
            }
          }
        } catch {
          /* abaikan */
        }

        persist(s);

        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "abc_order_broadcast",
              JSON.stringify({ carId: car.id, sellerId: car.sellerId, invoiceNumber, ts: now }),
            );
            window.dispatchEvent(
              new CustomEvent("order-created", { detail: { car, purchase: purchaseData } }),
            );
          }
        } catch {
          /* abaikan */
        }

        return purchaseData;
      },
      log(type, text, silent, carId) {
        const allowed = [
          "beli",
          "jual",
          "tawar",
          "favorit",
          "status",
          "verifikasi",
          "batal",
          "hapus",
        ];
        const t = (allowed.includes(type) ? type : "status") as HistEntry["type"];
        mutate((s) => {
          s.hist.unshift({
            id: uid("h"),
            type: t,
            text: String(text ?? ""),
            ts: Date.now(),
            carId: carId || null,
          });
          s.hist = s.hist.slice(0, 60);
          return s;
        });
        void silent;
      },
      setTarget(n) {
        const v = Math.max(1, Math.min(100, Math.round(Number(n) || 10)));
        mutate((s) => {
          s.settings.target = v;
          return s;
        });
        return v;
      },
      setWidgetHidden(id, hidden) {
        mutate((s) => {
          const list = new Set(
            Array.isArray(s.settings.hiddenWidgets) ? s.settings.hiddenWidgets : [],
          );
          if (hidden) list.add(id);
          else list.delete(id);
          s.settings.hiddenWidgets = [...list];
          return s;
        });
      },
      toggleWidget(id) {
        const hidden = !(cur().settings.hiddenWidgets || []).includes(id);
        this.setWidgetHidden(id, hidden);
        return hidden;
      },
      showAllWidgets() {
        mutate((s) => {
          s.settings.hiddenWidgets = [];
          return s;
        });
      },
      setDisplayName(n) {
        const v = (n || "").trim().slice(0, 40);
        mutate((s) => {
          s.settings.displayName = v;
          return s;
        });
        return v;
      },
      markNotifsRead() {
        mutate((s) => {
          s.settings.notifRead = Date.now();
          return s;
        });
      },
      clearHistory() {
        mutate((s) => {
          s.hist = [];
          return s;
        });
      },
      reset() {
        const keep = cur().settings.displayName || "";
        mutate((s) => {
          s.cars = [];
          s.favs = [];
          s.hist = [];
          s.settings = { target: 10, displayName: keep, notifRead: Date.now(), hiddenWidgets: [] };
          return s;
        });
      },
      setOwner(id, role = "guest") {
        const nextId = String(id || "");
        if (ownerRef.current === nextId && roleRef.current === role) return nextId;
        roleRef.current = role;
        ownerRef.current = nextId;
        const next = loadForOwner(ownerRef.current);
        snapRef.current = next;
        setSnap(next);
        return ownerRef.current;
      },
      duplicate(id) {
        const s = latestSnapshot();
        const src = s.cars.find((c) => c.id === id);
        if (src && !canMutateListing(src, "canEditOwnListing")) return null;
        if (!src) return null;
        const car: Car = clone(src);
        car.id = uid("c");
        car.title = String(src.title || "Mobil").slice(0, 70) + " (Salinan)";
        car.status = "queued";
        car.badge = "Baru";
        car.offers = [];
        delete car.purchase;
        car.createdAt = Date.now();
        s.cars.unshift(car);
        s.hist.unshift({
          id: uid("h"),
          type: "jual",
          text: `Listing <b>${esc(car.title)}</b> diduplikat dari <b>${esc(src.title)}</b>`,
          ts: Date.now(),
          carId: car.id,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return car;
      },
      clearFavs() {
        const s = latestSnapshot();
        const n = s.favs.length;
        s.favs = [];
        if (n)
          s.hist.unshift({
            id: uid("h"),
            type: "favorit",
            text: `${n} mobil dihapus dari favorit`,
            ts: Date.now(),
            carId: null,
          });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return n;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, ready, persist]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}
