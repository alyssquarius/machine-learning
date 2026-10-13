"use client";

import Link from "next/link";
import * as React from "react";
import { Icon } from "@/components/icons";
import { useStore } from "@/components/store-provider";
import { fmtRp } from "@/lib/format";

// ---------- KPI ----------

function useCountUp(target: number, duration = 1000): number {
  const [val, setVal] = React.useState(0);
  const reduce = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  React.useEffect(() => {
    if (reduce) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min((t - t0) / duration, 1);
      setVal(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return val;
}

function Sparkline({ values, hex, id }: { values: number[]; hex: string; id: number }) {
  const w = 120;
  const h = 36;
  const p = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [
    p + (i * (w - 2 * p)) / (values.length - 1),
    h - p - ((v - min) / (max - min || 1)) * (h - 2 * p),
  ]);
  const line = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hex} stopOpacity=".25" />
          <stop offset="1" stopColor={hex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${id})`} />
      <path d={line} fill="none" stroke={hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TONES: Record<string, { chip: string; hex: string }> = {
  ink: { chip: "bg-zinc-950 dark:bg-zinc-700 text-white dark:text-zinc-100", hex: "#3a3a43" },
  stone: { chip: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300", hex: "#52525b" },
  gray: { chip: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300", hex: "#6d6d77" },
  line: {
    chip: "bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800",
    hex: "#8e8e96",
  },
};

function KpiCard({
  label,
  value,
  money,
  delta,
  icon,
  tone,
  bar,
  spark,
  index,
}: {
  label: string;
  value: number;
  money?: boolean;
  delta: string;
  icon: string;
  tone: string;
  bar: string;
  spark: number[];
  index: number;
}) {
  const t = TONES[tone];
  const animated = useCountUp(value);
  const fmt = (n: number, d = 0) =>
    n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden="true" />
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-gray-500 dark:text-zinc-400">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.chip}`}>
          <Icon name={icon} />
        </span>
      </div>
      <p className={`mt-3 font-bold tracking-tight text-gray-900 dark:text-zinc-200 ${money ? "break-words text-lg sm:text-2xl" : "text-3xl"}`}>
        {money ? fmt(animated) : fmt(animated)}
      </p>
      {money ? <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{fmtRp(value)}</p> : null}
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-700 dark:text-zinc-100">
          <Icon name="trend" className="h-3.5 w-3.5" />
          {delta}
        </span>
        <Sparkline values={spark} hex={t.hex} id={index} />
      </div>
    </div>
  );
}

export function KpiGrid() {
  const store = useStore();
  const s = store.stats();
  const revenue = store.totalRevenue();
  const pendingOffers = store.pendingOffersCount();
  const sparkOf = (v: number) => {
    const b = Math.max(2, Number(v) || 0);
    return [b - 2, b - 1, b - 1, b, b, b, b].map((x) => Math.max(0, x));
  };
  const kpis = [
    { label: "Total Listing", value: s.total, delta: `${s.active} aktif`, icon: "database", tone: "ink", bar: "bg-zinc-950 dark:bg-zinc-600", spark: sparkOf(s.total) },
    { label: "Terjual", value: s.sold, delta: `${s.pending} menunggu`, icon: "check", tone: "stone", bar: "bg-zinc-500 dark:bg-zinc-500", spark: sparkOf(s.sold) },
    { label: "Tawaran Masuk", value: pendingOffers, delta: "menunggu putusan", icon: "tag", tone: "gray", bar: "bg-zinc-400 dark:bg-zinc-600", spark: sparkOf(pendingOffers) },
    { label: "Omzet Terjual", value: revenue, money: true, delta: `${s.sold} unit`, icon: "cart", tone: "line", bar: "bg-zinc-300 dark:bg-zinc-700", spark: sparkOf(s.sold) },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} index={i} />
      ))}
    </div>
  );
}

// ---------- Grafik garis ----------

function bucketize(events: number[], n: number, spanMs: number) {
  const counts = new Array(n).fill(0);
  const end = Date.now();
  const start = end - spanMs;
  events.forEach((ts) => {
    if (ts < start || ts > end) return;
    const i = Math.min(n - 1, Math.floor(((ts - start) / spanMs) * n));
    counts[i] += 1;
  });
  const cum: number[] = [];
  let acc = 0;
  counts.forEach((c) => {
    acc += c;
    cum.push(acc);
  });
  return cum;
}

export function TrendChart() {
  const store = useStore();
  const [range, setRange] = React.useState("30H");
  const sold = store.soldEvents();
  const all = store.all();
  const avg = all.length ? all.reduce((a, c) => a + (Number(c.interest) || 0), 0) / all.length : 0;

  const conf =
    ({ "7H": { n: 7, span: 7 * 864e5 }, "30H": { n: 10, span: 30 * 864e5 }, "90H": { n: 12, span: 90 * 864e5 } } as Record<string, { n: number; span: number }>)[range] ||
    { n: 7, span: 7 * 864e5 };
  const cum = bucketize(sold, conf.n, conf.span);
  const total = cum.length ? cum[cum.length - 1] : 0;
  const labels =
    range === "7H"
      ? (() => {
          const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          const out: string[] = [];
          for (let i = conf.n - 1; i >= 0; i--) out.push(names[new Date(Date.now() - i * 864e5).getDay()]);
          return out;
        })()
      : range === "30H"
        ? Array.from({ length: conf.n }, (_, i) => `H${Math.round(((i + 1) * 30) / conf.n)}`)
        : Array.from({ length: conf.n }, (_, i) => `M${i + 1}`);

  const W = 640;
  const H = 280;
  const PL = 44;
  const PR = 44;
  const PT = 16;
  const PB = 32;
  const x = (i: number) => PL + (i * (W - PL - PR)) / (conf.n - 1);
  const y = (v: number) => PT + ((100 - v) / 100) * (H - PT - PB);
  const acc = cum.map((v) => (total === 0 ? 0 : +((v / Math.max(1, total)) * 100).toFixed(1)));
  const loss = labels.map((_, i) => +(avg * (1 - (i / Math.max(1, labels.length - 1)) * 0.08)).toFixed(2));
  const smooth = (pts: number[][]) =>
    pts
      .map((p, i) => {
        if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        const q = pts[i - 1];
        const mx = ((q[0] + p[0]) / 2).toFixed(1);
        return `C${mx} ${q[1].toFixed(1)} ${mx} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      })
      .join(" ");
  const accPts = acc.map((v, i) => [x(i), y(v)]);
  const accPath = smooth(accPts);
  const area = `${accPath} L${x(conf.n - 1)} ${H - PB} L${x(0)} ${H - PB} Z`;
  const [hover, setHover] = React.useState<number | null>(null);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 pr-12 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white">Tren penjualan</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">Unit terjual & minat pembeli</p>
        </div>
        <div className="flex self-start rounded-lg border border-gray-200 bg-gray-100 p-1 sm:self-auto dark:border-zinc-800 dark:bg-zinc-800">
          {["7H", "30H", "90H"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition ${
                range === r
                  ? "border border-gray-200 bg-white text-black shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-72 w-full overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {!total ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Belum ada penjualan tercatat</p>
            <p className="max-w-xs text-xs text-gray-500 dark:text-zinc-400">
              Grafik terisi otomatis setelah ada mobil terjual (Beli / Terima tawaran / Tandai Terjual).
            </p>
            <Link href="/beli" className="mt-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950">
              Lihat Mobil Dijual
            </Link>
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Grafik penjualan dan minat">
            <defs>
              <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity=".14" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => {
              const gy = PT + (i * (H - PT - PB)) / 4;
              const pct = 100 - i * 25;
              return (
                <g key={i}>
                  <line x1={PL} x2={W - PR} y1={gy} y2={gy} stroke="currentColor" strokeOpacity=".2" strokeDasharray="4 4" />
                  <text x={PL - 8} y={gy + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">
                    {pct}%
                  </text>
                </g>
              );
            })}
            {labels.map((l, i) => (
              <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".6">
                {l}
              </text>
            ))}
            <path d={area} fill="url(#accFill)" />
            <path d={accPath} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d={smooth(loss.map((v, i) => [x(i), y(v)]))} fill="none" stroke="currentColor" opacity=".5" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 5" />
            {hover !== null ? (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="currentColor" opacity=".4" strokeDasharray="3 3" />
                <circle cx={x(hover)} cy={y(acc[hover])} r="5" fill="white" stroke="currentColor" strokeWidth="3" />
              </g>
            ) : null}
            <rect
              x={PL}
              y={PT}
              width={W - PL - PR}
              height={H - PT - PB}
              fill="transparent"
              onMouseMove={(e) => {
                const r = (e.target as SVGRectElement).getBoundingClientRect();
                const px = ((e.clientX - r.left) / r.width) * W;
                const i = Math.max(0, Math.min(conf.n - 1, Math.round((px - PL) / ((W - PL - PR) / (conf.n - 1)))));
                setHover(i);
              }}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hover !== null && total ? (
          <div className="pointer-events-none absolute z-10 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white shadow-lg dark:border dark:border-zinc-200 dark:bg-white dark:text-zinc-950" style={{ left: Math.max(60, Math.min(400, (x(hover) / W) * 400)), top: (y(acc[hover]) / H) * 280, transform: "translate(-50%,-120%)" }}>
            <p className="mb-1 font-semibold">{labels[hover]}</p>
            <p>Terjual {acc[hover]}% dari total ({total} unit)</p>
            <p className="opacity-70">Minat {loss[hover].toLocaleString("id-ID")}%</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------- Donut ----------

const MONO = ["#09090b", "#52525b", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#71717a"];

export function Donut() {
  const store = useStore();
  const dist = store.categoryDist();
  const total = store.stats().total;
  const [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    return () => cancelAnimationFrame(t);
  }, [total]);
  let acc = 0;
  return (
    <div>
      <h2 className="pr-12 text-lg font-bold text-black dark:text-white">Jenis mobil</h2>
      <p className="mb-6 mt-0.5 text-sm text-gray-500 dark:text-zinc-400">Distribusi berdasarkan kategori</p>
      <div className="relative min-h-48 w-full rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 42 42" className="h-full w-full" role="img" aria-label="Distribusi kategori mobil">
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="5" />
            {dist.map((d, i) => {
              const offset = 25 - acc;
              acc += d.pct;
              return (
                <circle
                  key={d.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  stroke={MONO[i % MONO.length]}
                  strokeWidth="5"
                  strokeDasharray={anim ? `${Math.max(d.pct - 1, 0)} ${101 - d.pct}` : "0 100"}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dasharray .9s ease-out" }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{total}</span>
            <span className="text-xs text-gray-500 dark:text-zinc-400">mobil</span>
          </div>
        </div>
        <ul className="mt-5 space-y-2.5 text-sm">
          {dist.map((d, i) => (
            <li key={d.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-600 dark:text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: MONO[i % MONO.length] }} />
                {d.label}
              </span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Bar aktivitas ----------

export function ActivityBars() {
  const store = useStore();
  const cars = store.all();
  const avg = cars.length ? cars.reduce((a, c) => a + (Number(c.interest) || 0), 0) / cars.length : 0;
  const weekAgo = Date.now() - 7 * 864e5;
  const hist = store.history().filter((h) => h.ts >= weekAgo);
  const days: [string, number][] = [
    ["Min", 0], ["Sen", 0], ["Sel", 0], ["Rab", 0], ["Kam", 0], ["Jum", 0], ["Sab", 0],
  ];
  hist.forEach((h) => {
    days[new Date(h.ts).getDay()][1] += 1;
  });
  const hours = days
    .map(([d, n]) => [d === "Min" ? "Min" : d, +Math.min(10, avg / 12 + n * 0.8 + 0.4).toFixed(1)] as [string, number])
    .sort((a, b) => ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].indexOf(a[0]) - ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].indexOf(b[0]));
  const max = Math.max(...hours.map((h) => h[1]), 1);
  const total = hours.reduce((a, h) => a + h[1], 0);
  const best = hours.reduce((a, h) => (h[1] > a[1] ? h : a));
  const totalOffers = store.pendingOffersCount();
  return (
    <div>
      <h2 className="mb-2 pr-12 text-base font-medium text-gray-400 dark:text-zinc-400">Aktivitas & Tawaran</h2>
      <div className="mb-4 flex items-end gap-3">
        <span className="text-4xl font-bold tracking-tight">{total.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>
        <span className="mb-1.5 text-sm font-medium text-gray-400 dark:text-zinc-500">skor minggu ini</span>
      </div>
      <div className="h-44 overflow-hidden">
        <div className="flex h-36 items-end gap-2 overflow-hidden sm:gap-3">
          {hours.map(([day, v]) => (
            <div key={day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end overflow-hidden">
              <div
                className={`w-full max-w-10 rounded-t-md transition-colors duration-200 ${v === max ? "bg-white dark:bg-zinc-300" : "bg-white/40 group-hover:bg-white/70 dark:bg-white/15 dark:group-hover:bg-white/30"}`}
                style={{ height: `${Math.round((v / max) * 108)}px` }}
                title={`${day}: ${v.toLocaleString("id-ID")}`}
              />
              <span className="mt-2 shrink-0 text-[11px] leading-none text-gray-400 dark:text-zinc-500">{day}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 text-xs font-medium text-gray-400 dark:text-zinc-400">
        <div>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Tawaran menunggu</p>
          <p className="font-semibold text-white dark:text-zinc-200">{totalOffers} tawaran</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Hari teramai</p>
          <p className="font-semibold text-white dark:text-zinc-200">
            {best[0]} · {best[1].toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  );
}
