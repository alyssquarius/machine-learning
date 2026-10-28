"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ActivityBars, Donut, KpiGrid, TrendChart } from "@/components/dashboard-widgets";
import { HistText } from "@/components/hist-text";
import { useStore } from "@/components/store-provider";
import { useRole } from "@/components/role-provider";
import { fmtRp, timeAgo } from "@/lib/format";
import { STATUS_LABEL } from "@/components/car-card";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
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
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    </button>
  );
}

function Banner() {
  const store = useStore();
  const { user } = useRole();
  const [greeting, setGreeting] = React.useState("Selamat datang");
  const name =
    store.getDisplayName() ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "kembali";
  const target = store.getTarget();
  const sold = store.soldThisMonth();
  const pct = Math.min(100, Math.round((sold / Math.max(1, target)) * 100));
  React.useEffect(() => {
    const hour = Number(
      new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "numeric",
        hourCycle: "h23",
      }).format(new Date()),
    );
    setGreeting(
      hour < 11
        ? "Selamat pagi"
        : hour < 15
          ? "Selamat siang"
          : hour < 18
            ? "Selamat sore"
            : "Selamat malam",
    );
  }, []);
  return (
    <div className="hero-panel dashboard-hero">
      <div className="hero-photo" />
      <div className="absolute right-3 top-3">
        <HideButton id="banner" title="Sembunyikan sapaan" />
      </div>
      <div className="relative">
        <p className="hero-eyebrow">WORKSPACE KAMU</p>
        <h2 className="mb-3 mt-3 text-[29px] font-semibold leading-tight tracking-tight">
          {greeting}, {name}.
        </h2>
        <p className="hero-description">Ringkasan inventaris dan penawaran, dalam satu tempat.</p>
        <div className="hero-actions">
          <Link href="/jual" className="button-primary">
            <Icon name="plus" className="h-4 w-4" />
            Tambah listing
          </Link>
          <Link href="/beli" className="hero-link">
            Jelajahi katalog
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="hero-target">
        <small>Target penjualan bulan ini</small>
        <div className="target-number my-3">
          {pct}
          <span className="ml-1 text-base text-emerald-100/60">%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-emerald-200" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-[10px] text-emerald-100/70">
          {sold} dari {target} unit tercapai
        </p>
        <Link
          href="/pengaturan"
          className="mt-3 inline-block text-[9px] text-emerald-200 underline underline-offset-4"
        >
          Atur target penjualan
        </Link>
      </div>
    </div>
  );
}

function InventoryTable() {
  const store = useStore();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const cars = store.inventory().filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    const needle = q.trim().toLowerCase();
    if (
      needle &&
      !(c.title.toLowerCase().includes(needle) || (c.location || "").toLowerCase().includes(needle))
    )
      return false;
    return true;
  });
  return (
    <div className="relative flex flex-col overflow-hidden surface lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div className="pr-12">
          <h2 className="text-lg font-bold text-black dark:text-white">Daftar Inventaris</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
            Kelola mobil yang sedang didaftarkan
          </p>
        </div>
        <div className="absolute right-4 top-4">
          <HideButton id="table" title="Sembunyikan inventaris" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="group relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black dark:group-focus-within:text-white"
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Cari mobil..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black sm:w-56 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          >
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
              <tr
                key={c.id}
                className="border-b border-gray-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-6 py-3">
                  <p className="font-medium text-slate-900 dark:text-zinc-100">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {c.year} • {c.location}
                  </p>
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
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
            Menampilkan {Math.min(8, cars.length)} dari {cars.length} data
          </p>
        )}
      </div>
    </div>
  );
}

function PopularList() {
  const store = useStore();
  const popular = store.popular(3);
  return (
    <div className="surface relative p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between gap-2 pr-12">
        <h2 className="text-base font-bold text-black dark:text-white">Mobil Populer</h2>
        <Link
          href="/beli"
          className="text-xs font-semibold text-black transition-all hover:underline dark:text-white"
        >
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
            <Link
              key={c.id}
              href={`/beli?detail=${c.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
            >
              <Image
                src={c.image || `/images/car-hero.jpg`}
                alt={c.title}
                width={64}
                height={48}
                unoptimized
                className="h-12 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {c.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {fmtRp(c.price)} • {c.interest}% diminati
                </p>
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
    <div className="surface relative p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="absolute right-4 top-4">
        <HideButton id="recent" title="Sembunyikan aktivitas terbaru" />
      </div>
      <h2 className="mb-5 pr-12 text-base font-bold text-black dark:text-white">
        Aktivitas Terbaru
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">Belum ada aktivitas.</p>
      ) : (
        <ul className="relative space-y-6">
          {items.map((h) => (
            <li key={h.id} className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${TONE[h.type] || TONE.status}`}
              />
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
  const { permissions, authChecked } = useRole();
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
          <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="OVERVIEW"
        title="Dashboard"
        description="Pantau aktivitas dan kelola kendaraanmu."
        actions={
          <Link href="/jual" className="button-secondary">
            <Icon name="tag" className="h-4 w-4" />
            Kelola inventaris
          </Link>
        }
      />
      {hidden.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <span className="mr-1 text-xs font-medium text-gray-500 dark:text-zinc-400">
            Disembunyikan:
          </span>
          <span className="flex flex-wrap gap-2">
            {hidden.map((id) => (
              <button
                key={id}
                onClick={() => store.setWidgetHidden(id, false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                {WIDGETS.find((w) => w.id === id)?.label || id}
              </button>
            ))}
          </span>
          <button
            onClick={() => store.showAllWidgets()}
            className="ml-auto text-xs font-semibold text-black hover:underline dark:text-white"
          >
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
          <div className="surface relative p-6 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute right-4 top-4">
              <HideButton id="trend" title="Sembunyikan tren" />
            </div>
            <TrendChart />
          </div>
        )}
        {isHidden("donut") ? null : (
          <div className="surface relative flex flex-col p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
            <div className="relative rounded-2xl border border-emerald-900 bg-[#102e49] p-6 text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
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
