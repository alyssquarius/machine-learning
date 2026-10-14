"use client";

import * as React from "react";
import { cleanCategory } from "@/lib/cities";
import { safeImageUrl } from "@/lib/format";

// ---------- Tipe ----------

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
  method: "tunai" | "kredit" | "tawar";
  dp: number;
  tenor: number;
  rate: number;
  installment: number;
  name: string;
  phone: string;
  ts: number;
}

export interface Car {
  id: string;
  title: string;
  price: number;
  year: number;
  km: number;
  location: string;
  category: string;
  status: CarStatus;
  interest: number;
  badge: string;
  image: string;
  description: string;
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

// ---------- Foto fallback per kategori ----------

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

// ---------- Penyimpanan per-akun ----------

const LS_CARS = "abc_cars_v3";
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
      o.title = String(o.title || "Mobil").slice(0, 80);
      o.price = Math.max(0, Number(o.price) || 0);
      const my = new Date().getFullYear();
      o.year = Math.min(my, Math.max(1990, Number(o.year) || my));
      o.km = Math.max(0, Number(o.km) || 0);
      o.location = String(o.location || "-").slice(0, 60) || "-";
      o.category = cleanCategory(o.category);
      o.status = STATUSES.includes(o.status) ? o.status : "queued";
      o.interest = Math.max(0, Math.min(100, Number(o.interest) || 0));
      o.badge = String(o.badge || "").slice(0, 24);
      o.image = typeof o.image === "string" ? o.image.slice(0, 500) : "";
      o.description =
        typeof o.description === "string" ? o.description.slice(0, 500) : "";
      o.createdAt = Number(o.createdAt) > 0 ? Number(o.createdAt) : Date.now();
      o.offers = Array.isArray(o.offers)
        ? (o.offers as Offer[])
            .filter((x) => x && typeof x.id === "string")
            .map((x) => ({
              id: String(x.id),
              amount: Math.max(0, Number(x.amount) || 0),
              note: String(x.note || "").slice(0, 140),
              ts: Number(x.ts) > 0 ? Number(x.ts) : Date.now(),
              status: (["pending", "accepted", "rejected"] as OfferStatus[]).includes(
                x.status
              )
                ? x.status
                : "pending",
            }))
        : [];
      if (o.purchase && typeof o.purchase === "object") {
        const p = o.purchase;
        o.purchase = {
          method: (["tunai", "kredit", "tawar"] as const).includes(p.method as "tunai")
            ? (p.method as Purchase["method"])
            : "tunai",
          dp: Math.max(0, Number(p.dp) || 0),
          tenor: Math.max(0, Number(p.tenor) || 0),
          rate: Math.max(0, Math.min(30, Number(p.rate) || 0)),
          installment: Math.max(0, Number(p.installment) || 0),
          name: String(p.name || "").slice(0, 60),
          phone: String(p.phone || "").slice(0, 20),
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

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

// ---------- Context ----------

interface StoreApi {
  ready: boolean;
  cars: Car[];
  all(): Car[];
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
  add(data: Partial<Car> & { title: string; price: number; year: number }): Car;
  update(id: string, patch: Partial<Car>): Car | null;
  remove(id: string): boolean;
  setStatus(id: string, status: CarStatus): Car | null;
  edit(id: string, data: Partial<Car>): Car | null;
  buy(
    id: string,
    opts?: { method?: "tunai" | "kredit"; dp?: number; tenor?: number; rate?: number; installment?: number; name?: string; phone?: string }
  ): boolean;
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
  setOwner(id: string): string;
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

export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ownerRef = React.useRef("");
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
    []
  );

  const persist = React.useCallback(
    (next: Snapshot) => {
      save(scoped(LS_CARS), next.cars);
      save(scoped(LS_FAVS), next.favs);
      save(scoped(LS_HIST), next.hist.slice(0, 60));
      save(scoped(LS_SET), next.settings);
      setSnap({ ...next, cars: [...next.cars] });
    },
    [scoped]
  );

  const loadForOwner = React.useCallback(
    (ownerId: string) => {
      const k = (b: string) => (ownerId ? `${b}_${ownerId}` : b);
      let cars = normalizeCars(load(k(LS_CARS), []));
      let favs = load<string[]>(k(LS_FAVS), []);
      if (!Array.isArray(favs)) favs = [];
      const hist = normalizeHist(load(k(LS_HIST), []));
      const settings = normalizeSettings(load(k(LS_SET), {}));
      favs = favs.filter((id) => cars.some((c) => c.id === id));
      return { cars, favs, hist, settings };
    },
    []
  );

  // Muat data default (tanpa owner) saat mount agar SSR aman.
  React.useEffect(() => {
    setSnap(loadForOwner(""));
    setReady(true);
  }, [loadForOwner]);

  const api: StoreApi = React.useMemo(() => {
    const cur = () => snapRef.current;
    const mutate = (fn: (s: Snapshot) => Snapshot, opts?: { silentHist?: boolean }) => {
      const next = fn(clone(cur()));
      void opts;
      persist(next);
    };

    return {
      ready,
      cars: snap.cars,
      all() {
        return [...cur().cars].sort((a, b) => b.createdAt - a.createdAt);
      },
      get(id) {
        return cur().cars.find((c) => c.id === id);
      },
      history() {
        return [...cur().hist].sort((a, b) => b.ts - a.ts);
      },
      stats(): Stats {
        const cars = cur().cars;
        const favs = cur().favs;
        return {
          total: cars.length,
          active: cars.filter((c) => c.status === "running").length,
          sold: cars.filter((c) => c.status === "done").length,
          pending: cars.filter((c) => c.status === "queued").length,
          favCount: favs.filter((id) => cars.some((c) => c.id === id)).length,
          activeValue: cars
            .filter((c) => c.status === "running")
            .reduce((a, c) => a + (c.price || 0), 0),
        };
      },
      categoryDist() {
        const cars = cur().cars;
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
        return [...cur().cars]
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
        return cur().cars.reduce(
          (a, c) => a + ((c.offers || []).filter((o) => o.status === "pending").length),
          0
        );
      },
      totalRevenue() {
        return cur().cars
          .filter((c) => c.status === "done")
          .reduce((a, c) => a + (Number(c.price) || 0), 0);
      },
      soldThisMonth() {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        return this.soldEvents().filter((ts) => ts >= start).length;
      },
      soldEvents() {
        return cur()
          .cars.filter((c) => c.status === "done")
          .map((c) => (c.purchase && c.purchase.ts) || c.createdAt)
          .filter((ts) => ts > 0)
          .sort((a, b) => a - b);
      },
      listedEvents() {
        return cur().cars
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
        const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
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
        const s = clone(cur());
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
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
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
            method: "tawar",
            dp: 0,
            tenor: 0,
            rate: 0,
            installment: 0,
            name: (offer.note || "").trim().slice(0, 60),
            phone: "",
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
        const s = clone(cur());
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
        const s = clone(cur());
        const category = cleanCategory(data.category, "SUV");
        const maxYear = new Date().getFullYear();
        const yearNum = Math.min(maxYear, Math.max(1990, Number(data.year) || maxYear));
        const car: Car = {
          id: uid("c"),
          title: String(data.title || "").trim().slice(0, 80),
          price: Math.max(0, Number(data.price) || 0),
          year: yearNum,
          km: Math.max(0, Number(data.km) || 0),
          location: String(data.location || "-").slice(0, 60) || "-",
          category,
          status: "queued",
          interest: 50,
          badge: "Baru",
          image: imageFor(category, data.image),
          description: String(data.description || "").trim().slice(0, 500),
          createdAt: Date.now(),
          offers: [],
        };
        s.cars.unshift(car);
        s.hist.unshift({
          id: uid("h"),
          type: "jual",
          text: `Mobil baru <b>${esc(car.title)}</b> ditambahkan, menunggu verifikasi`,
          ts: Date.now(),
          carId: null,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return car;
      },
      update(id, patch) {
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
        if (!car) return null;
        const allowed = ["title", "price", "year", "km", "location", "category", "status", "badge", "image", "description", "interest"];
        const clean: Partial<Car> = {};
        Object.keys(patch || {}).forEach((k) => {
          if (allowed.includes(k)) (clean as Record<string, unknown>)[k] = (patch as Record<string, unknown>)[k];
        });
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
        Object.assign(car, clean);
        persist(s);
        return car;
      },
      remove(id) {
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
        if (!car) return false;
        s.cars = s.cars.filter((c) => c.id !== id);
        s.favs = s.favs.filter((f) => f !== id);
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
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
        if (!car) return null;
        car.status = status;
        const label =
          ({ done: "terjual", running: "ditayangkan", queued: "menunggu verifikasi", failed: "ditolak" } as Record<string, string>)[status] || status;
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
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
        if (!car) return null;
        const title = String(data.title || "").trim().slice(0, 80);
        const price = Number(data.price) || 0;
        const year = Number(data.year) || car.year;
        const maxYear = new Date().getFullYear();
        if (title.length < 4 || !price || price < 1000000 || !year || year < 1990 || year > maxYear)
          return null;
        car.title = title;
        car.price = price;
        car.year = year;
        car.km = Math.max(0, Number(data.km) || 0);
        car.location = String(data.location || "").trim().slice(0, 60) || "-";
        car.category = cleanCategory(data.category, car.category as never);
        if (Object.prototype.hasOwnProperty.call(data, "image")) {
          const img = safeImageUrl(data.image);
          if (img) car.image = img;
        }
        car.description = String(data.description || "").trim().slice(0, 500);
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
        const s = clone(cur());
        const car = s.cars.find((c) => c.id === id);
        if (!car || car.status !== "running") return false;
        car.status = "done";
        car.badge = "Terjual";
        const method = opts.method === "kredit" ? "kredit" : "tunai";
        car.purchase = {
          method,
          dp: Math.max(0, Number(opts.dp) || 0),
          tenor: Math.max(0, Number(opts.tenor) || 0),
          rate: Math.max(0, Number(opts.rate) || 0),
          installment: Math.max(0, Number(opts.installment) || 0),
          name: String(opts.name || "").trim().slice(0, 60),
          phone: String(opts.phone || "").trim().slice(0, 20),
          ts: Date.now(),
        };
        s.hist.unshift({
          id: uid("h"),
          type: "beli",
          text:
            method === "kredit"
              ? `Mobil <b>${esc(car.title)}</b> dibeli kredit — DP Rp ${car.purchase.dp.toLocaleString("id-ID")}, ${car.purchase.tenor}× Rp ${car.purchase.installment.toLocaleString("id-ID")}/bln`
              : `Mobil <b>${esc(car.title)}</b> berhasil dibeli tunai (Rp ${car.price.toLocaleString("id-ID")})`,
          ts: Date.now(),
          carId: car.id,
        });
        s.hist = s.hist.slice(0, 60);
        persist(s);
        return true;
      },
      log(type, text, silent, carId) {
        const allowed = ["beli", "jual", "tawar", "favorit", "status", "verifikasi", "batal", "hapus"];
        const t = (allowed.includes(type) ? type : "status") as HistEntry["type"];
        mutate((s) => {
          s.hist.unshift({ id: uid("h"), type: t, text: String(text ?? ""), ts: Date.now(), carId: carId || null });
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
            Array.isArray(s.settings.hiddenWidgets) ? s.settings.hiddenWidgets : []
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
      setOwner(id) {
        ownerRef.current = String(id || "");
        setSnap(loadForOwner(ownerRef.current));
        return ownerRef.current;
      },
      duplicate(id) {
        const s = clone(cur());
        const src = s.cars.find((c) => c.id === id);
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
        const s = clone(cur());
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
