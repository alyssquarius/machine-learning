"use client";
import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useStore } from "@/components/store-provider";
import { fmtRp, shortRp } from "@/lib/format";

export function KpiGrid() {
  const store = useStore();
  const stats = store.stats();
  const cards = [
    { label: "Total inventaris", value: String(stats.total).padStart(2, "0"), icon: "car", caption: `${stats.active} aktif ditawarkan`, tag: "Inventaris" },
    { label: "Mobil terjual", value: String(stats.sold).padStart(2, "0"), icon: "check", caption: "dari seluruh inventaris", tag: `${stats.total ? Math.round(stats.sold / stats.total * 100) : 0}%` },
    { label: "Penawaran masuk", value: String(store.pendingOffersCount()).padStart(2, "0"), icon: "tag", caption: "menunggu keputusan", tag: "Penawaran" },
    { label: "Nilai penjualan", value: shortRp(store.totalRevenue()), icon: "trend", caption: `${stats.sold} unit terjual`, tag: "Rupiah" },
  ];
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">{cards.map((card, i) => <div key={card.label} className="surface kpi-card"><div className="flex items-center justify-between gap-3"><p className="kpi-label">{card.label}</p><span className={`soft-icon ${i === 1 ? "!bg-amber-50 !text-amber-600 dark:!bg-amber-950/30" : i === 2 ? "!bg-blue-50 !text-blue-600 dark:!bg-blue-950/30" : ""}`}><Icon name={card.icon} className="h-[18px] w-[18px]" /></span></div><p className="kpi-value">{card.value}</p><p className="kpi-caption"><span>{card.tag}</span>{card.caption}</p></div>)}</div>;
}

function series(events: number[], buckets: number, spanDays: number) {
  const end = Date.now();
  const span = spanDays * 86400000;
  const counts = Array<number>(buckets).fill(0);
  events.forEach(ts => { if (ts >= end - span && ts <= end) counts[Math.min(buckets - 1, Math.floor((ts - (end - span)) / span * buckets))]++; });
  return counts;
}
export function TrendChart() {
  const store = useStore();
  const [days, setDays] = React.useState(30);
  const n = days === 7 ? 7 : 10;
  const listed = series(store.listedEvents(), n, days);
  const sold = series(store.soldEvents(), n, days);
  const max = Math.max(...listed, ...sold, 4);
  const total = sold.reduce((a, b) => a + b, 0);
  const hasData = listed.some(Boolean) || sold.some(Boolean);
  const x = (i: number) => 40 + i * 550 / (n - 1);
  const y = (count: number) => 190 - count / max * 140;
  const points = sold.map((count, i) => `${x(i)},${y(count)}`).join(" ");
  return <div><div className="flex flex-wrap items-start justify-between gap-3 pr-7"><div><p className="eyebrow">PERFORMA INVENTARIS</p><h2 className="text-base font-semibold">Perjalanan penjualanmu</h2><p className="page-description !mt-1">Listing baru dan mobil terjual dalam periode pilihan.</p></div><div className="flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">{[7, 30, 90].map(d => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${days === d ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-700 dark:text-emerald-300" : "text-gray-500"}`}>{d} hari</button>)}</div></div><div className="mb-3 mt-5 flex items-center justify-between"><div><span className="text-2xl font-semibold tracking-tight">{total}</span><span className="ml-2 text-[10px] text-gray-500">unit terjual</span></div><div className="flex gap-4 text-[10px] text-gray-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-600" />Terjual</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-100 dark:bg-emerald-900" />Listing baru</span></div></div><div className="relative"><svg viewBox="0 0 630 225" className="w-full" role="img" aria-label={`Grafik ${days} hari: ${total} mobil terjual`}><defs><linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#168366" stopOpacity=".16" /><stop offset="1" stopColor="#168366" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="35" x2="605" y1={50 + i * 35} y2={50 + i * 35} stroke="currentColor" className="text-gray-200 dark:text-zinc-700" strokeDasharray="3 5" /><text x="22" y={54 + i * 35} textAnchor="end" fontSize="9" fill="#8a9b90">{Math.round(max * (4 - i) / 4)}</text></g>)}{hasData ? <><path d={`M${x(0)},190 L${points.replaceAll(' ', ' L')} L${x(n - 1)},190 Z`} fill="url(#sales-area)" />{listed.map((count, i) => <rect key={i} x={x(i) - 9} y={y(count)} width="18" height={190 - y(count)} rx="4" fill="#168366" fillOpacity=".12"><title>{count} listing baru</title></rect>)}<polyline points={points} fill="none" stroke="#168366" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />{sold.map((count, i) => <circle key={i} cx={x(i)} cy={y(count)} r="3" fill="#168366"><title>{count} unit terjual</title></circle>)}</> : null}{Array.from({ length: n }, (_, i) => <text key={i} x={x(i)} y="216" textAnchor="middle" fill="#8a9b90" fontSize="9">{new Date(Date.now() - (n - 1 - i) * days / n * 864e5).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</text>)}</svg>{!hasData ? <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="soft-icon mb-3"><Icon name="trend" /></span><p className="text-xs font-semibold">Cerita penjualanmu dimulai di sini</p><p className="mt-1 text-[10px] text-gray-500">Grafik terisi otomatis setelah ada aktivitas.</p><Link href="/jual" className="mt-3 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Tambahkan listing pertama →</Link></div> : null}</div></div>;
}
const COLORS = ["#168366", "#7bbda0", "#c3dece", "#e3b868", "#8a9fa2", "#b8cac1"];
export function Donut() {
  const store = useStore(); const dist = store.categoryDist(); const total = store.stats().total;
  let offset = 0;
  return <div className="flex h-full flex-col"><p className="eyebrow">KOMPOSISI KENDARAAN</p><h2 className="pr-7 text-base font-semibold">Ragam inventaris</h2><p className="page-description !mt-1">Distribusi berdasarkan kategori mobil.</p><div className="relative mx-auto mt-6 h-40 w-40"><svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" role="img" aria-label={`${total} mobil dalam ${dist.length} kategori`}><circle cx="20" cy="20" r="15.915" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-zinc-800" />{dist.map((d, i) => { const start = offset; offset += d.pct; return <circle key={d.label} cx="20" cy="20" r="15.915" fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="4" strokeDasharray={`${Math.max(0, d.pct - 1)} ${101 - d.pct}`} strokeDashoffset={-start} />; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-semibold tracking-tight">{String(total).padStart(2, '0')}</span><span className="mt-1 text-[10px] text-gray-500">Total mobil</span></div></div><ul className="mt-6 space-y-3">{dist.length ? dist.map((d, i) => <li key={d.label} className="flex justify-between text-xs"><span className="flex items-center gap-2 text-gray-500 dark:text-zinc-400"><i className="h-2 w-2 rounded-full" style={{background:COLORS[i % COLORS.length]}} />{d.label}</span><strong className="font-semibold">{d.pct}%</strong></li>) : <li className="pb-3 text-center text-[11px] leading-relaxed text-gray-500">Kategori kendaraanmu akan<br />ditampilkan setelah listing ditambahkan.</li>}</ul></div>;
}
export function ActivityBars() {
  const store = useStore();
  const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate() - 6);
  const buckets = Array.from({length:7}, (_, i) => ({ day:new Date(start.getTime() + i * 864e5), count:0 }));
  store.history().forEach(h => { const i = Math.floor((h.ts - start.getTime()) / 864e5); if(i >= 0 && i < 7) buckets[i].count++; });
  const max = Math.max(...buckets.map(b => b.count), 1);
  const total = buckets.reduce((s,b) => s + b.count,0);
  return <div><p className="hero-eyebrow">TUJUH HARI TERAKHIR</p><h2 className="mt-2 text-base font-semibold">Aktivitas workspace</h2><div className="mt-5 flex items-baseline gap-2"><span className="text-3xl font-semibold">{total}</span><span className="text-[10px] text-emerald-100/60">aktivitas tercatat</span></div><div className="mt-4 flex h-24 items-end gap-3">{buckets.map(b => <div key={b.day.toISOString()} className="flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="mx-auto w-full max-w-8 rounded-t-md bg-emerald-200/60" style={{height:Math.max(2,b.count / max * 62)}} title={`${b.count} aktivitas`} /><span className="text-[9px] text-emerald-100/60">{b.day.toLocaleDateString('id-ID',{weekday:'short'})}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-[10px] text-emerald-100/60"><span>Tawaran menunggu</span><strong className="text-white">{store.pendingOffersCount()} penawaran</strong></div></div>;
}
