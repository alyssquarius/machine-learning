"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ActivityBars, Donut, KpiGrid, TrendChart } from "@/components/dashboard-widgets";
import { HistText } from "@/components/hist-text";
import { useStore } from "@/components/store-provider";
import { useRole } from "@/components/role-provider";
import { createClient } from "@/lib/supabase/client";
import { fmtRp, timeAgo } from "@/lib/format";
import { STATUS_LABEL } from "@/components/car-card";
import { WIDGETS } from "@/lib/market";

function HideButton({ id, title, dark = false }: { id: string; title: string; dark?: boolean }) {
  const store = useStore();
  return (
    <button
      onClick={() => store.setWidgetHidden(id, true)}
      title={title}
      className={`rounded-md p-1.5 transition ${
        dark
          ? "text-zinc-400 hover:bg-white/10 hover:text-white dark:hover:text-zinc-100"
          : "rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-black dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-white"
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    </button>
  );
}

function Banner() {
  const store = useStore();
  const [name, setName] = React.useState("User");
  const [date, setDate] = React.useState("");
  const [greet, setGreet] = React.useState("Selamat Datang");
  const s = store.stats();
  const target = store.getTarget();
  const soldMonth = store.soldThisMonth();
  const pct = Math.min(100, Math.round((soldMonth / Math.max(1, target)) * 100));
  const favCount = s.favCount;

  React.useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 11 ? "Selamat Pagi" : h < 15 ? "Selamat Siang" : h < 18 ? "Selamat Sore" : "Selamat Malam");
    setDate(new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const u = data?.user;
        const dn = store.getDisplayName();
        setName(dn || String(u?.user_metadata?.full_name || u?.email?.split("@")[0] || "User"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.ready]);

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border border-zinc-950 bg-zinc-950 p-6 text-white sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url(/images/car-hero.jpg)" }} />
      <div className="absolute inset-0 bg-zinc-950/80 dark:bg-zinc-900/70" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{date}</p>
            <HideButton id="banner" title="Sembunyikan banner" dark />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {greet}, <span className="text-white dark:text-zinc-100">{name}</span>!
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base dark:text-zinc-400">
            Anda punya {s.active} mobil aktif dan {s.sold} terjual. Temukan penawaran terbaik hari ini untuk mobil idamanmu di AutoBuyCars.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/beli" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200 dark:bg-zinc-200 dark:hover:bg-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cari Mobil Baru
            </Link>
            <Link href="/favorit" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/15 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{favCount} mobil difavoritkan</span>
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 lg:w-72 dark:border-white/10 dark:bg-black/25">
          <div className="mb-3 flex justify-between text-sm">
            <span className="font-medium text-zinc-300 dark:text-zinc-400">Target penjualan</span>
            <span className="font-bold text-white dark:text-zinc-100">{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15 dark:bg-white/10">
            <div className="h-full rounded-full bg-white transition-all duration-1000 dark:bg-zinc-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {soldMonth}/{target} terjual bulan ini
          </p>
        </div>
      </div>
    </div>
  );
}

function InventoryTable() {
  const store = useStore();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const cars = store.all().filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    const needle = q.trim().toLowerCase();
    if (needle && !(c.title.toLowerCase().includes(needle) || (c.location || "").toLowerCase().includes(needle))) return false;
    return true;
  });
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div className="pr-12">
          <h2 className="text-lg font-bold text-black dark:text-white">Daftar Inventaris</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">Kelola mobil yang sedang didaftarkan</p>
        </div>
        <div className="absolute right-4 top-4">
          <HideButton id="table" title="Sembunyikan inventaris" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="group relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black dark:group-focus-within:text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Cari mobil..." className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black sm:w-56 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white">
            <option value="all">Semua status</option>
            <option value="done">Terjual</option>
            <option value="running">Dijual</option>
            <option value="queued">Menunggu</option>
            <option value="failed">Ditolak</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
          <thead className="border-b border-gray-200 bg-white text-xs uppercase text-gray-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Mobil</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Harga</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Waktu</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {cars.slice(0, 8).map((c) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 dark:border-zinc-800">
                <td className="px-6 py-3">
                  <p className="font-medium text-slate-900 dark:text-zinc-100">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{c.year} • {c.location}</p>
                </td>
                <td className="px-6 py-3">{fmtRp(c.price)}</td>
                <td className="px-6 py-3">{STATUS_LABEL[c.status]}</td>
                <td className="px-6 py-3">{timeAgo(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 bg-white p-4 text-center sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {cars.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">Tidak ada data ditemukan</p>
        ) : (
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Menampilkan {Math.min(8, cars.length)} dari {cars.length} data</p>
        )}
      </div>
    </div>
  );
}

function PopularList() {
  const store = useStore();
  const popular = store.popular(3);
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between gap-2 pr-12">
        <h2 className="text-base font-bold text-black dark:text-white">Mobil Populer</h2>
        <Link href="/beli" className="text-xs font-semibold text-black transition-all hover:underline dark:text-white">
          Lihat Semua
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <HideButton id="popular" title="Sembunyikan populer" />
      </div>
      <div className="space-y-4">
        {popular.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">Belum ada listing.</p>
        ) : (
          popular.map((c) => (
            <Link key={c.id} href={`/beli?detail=${c.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
              <Image
                src={c.image || `/images/car-hero.jpg`}
                alt={c.title}
                width={64}
                height={48}
                unoptimized
                className="h-12 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{c.title}</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{fmtRp(c.price)} • {c.interest}% diminati</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  beli: "bg-zinc-950 dark:bg-white",
  jual: "bg-zinc-500",
  tawar: "bg-zinc-400",
  favorit: "bg-zinc-400",
  status: "bg-zinc-500",
  verifikasi: "bg-zinc-300 dark:bg-zinc-600",
  batal: "bg-red-500",
  hapus: "bg-zinc-300 dark:bg-zinc-600",
};

function RecentActivity() {
  const store = useStore();
  const items = store.history().slice(0, 5);
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <HideButton id="recent" title="Sembunyikan aktivitas terbaru" />
      </div>
      <h2 className="mb-5 pr-12 text-base font-bold text-black dark:text-white">Aktivitas Terbaru</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">Belum ada aktivitas.</p>
      ) : (
        <ul className="relative space-y-6">
          {items.map((h) => (
            <li key={h.id} className="flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${TONE[h.type] || TONE.status}`} />
              <div className="min-w-0">
                <h4 className="text-sm text-gray-800 dark:text-zinc-200">
                  <HistText text={h.text} />
                </h4>
                <p className="text-xs text-gray-500 dark:text-zinc-500">{timeAgo(h.ts)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { role, permissions, authChecked } = useRole();
  const store = useStore();
  const hidden = store.getHiddenWidgets();
  const isHidden = (id: string) => hidden.includes(id);

  React.useEffect(() => {
    if (authChecked && !permissions.canAccessDashboard) {
      router.replace("/beli");
    }
  }, [authChecked, permissions.canAccessDashboard, router]);

  if (!authChecked || !permissions.canAccessDashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-zinc-700 dark:border-t-white" />
          <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">Memuat katalog mobil...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {hidden.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <span className="mr-1 text-xs font-medium text-gray-500 dark:text-zinc-400">Disembunyikan:</span>
          <span className="flex flex-wrap gap-2">
            {hidden.map((id) => (
              <button
                key={id}
                onClick={() => store.setWidgetHidden(id, false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                {WIDGETS.find((w) => w.id === id)?.label || id}
              </button>
            ))}
          </span>
          <button onClick={() => store.showAllWidgets()} className="ml-auto text-xs font-semibold text-black hover:underline dark:text-white">
            Tampilkan semua
          </button>
        </div>
      ) : null}

      {isHidden("banner") ? null : <Banner />}

      {isHidden("kpis") ? null : (
        <div className="relative mb-8">
          <div className="absolute -top-2 right-2 z-10">
            <HideButton id="kpis" title="Sembunyikan ringkasan" />
          </div>
          <KpiGrid />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isHidden("trend") ? null : (
          <div className="relative rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute right-4 top-4">
              <HideButton id="trend" title="Sembunyikan tren" />
            </div>
            <TrendChart />
          </div>
        )}
        {isHidden("donut") ? null : (
          <div className="relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute right-4 top-4">
              <HideButton id="donut" title="Sembunyikan jenis mobil" />
            </div>
            <Donut />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {isHidden("table") ? null : <InventoryTable />}
        <div className="space-y-6">
          {isHidden("popular") ? null : <PopularList />}
          {isHidden("activity") ? null : (
            <div className="relative rounded-xl border border-black bg-black p-6 text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              <div className="absolute right-4 top-4">
                <HideButton id="activity" title="Sembunyikan aktivitas" />
              </div>
              <ActivityBars />
            </div>
          )}
          {isHidden("recent") ? null : <RecentActivity />}
        </div>
      </div>
    </div>
  );
}
