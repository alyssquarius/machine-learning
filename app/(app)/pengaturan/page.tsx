"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { WIDGETS } from "@/lib/market";
import { useRole } from "@/components/role-provider";
import { RoleBadge } from "@/components/role-badge";

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800 animate-fade-in"
      role="status"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Tersimpan
    </span>
  );
}

export default function PengaturanPage() {
  const store = useStore();
  const { toast } = useToast();
  const { role, logout, switchRole } = useRole();
  const { theme, setTheme } = useTheme();

  const [saved, setSaved] = React.useState(false);
  const [user, setUser] = React.useState({ name: "User", email: "user@example.com" });
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [target, setTarget] = React.useState("10");
  const [switchingRole, setSwitchingRole] = React.useState(false);

  const dnTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tgTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setDisplayName(store.getDisplayName());
    setTarget(String(store.getTarget()));
    createClient()
      .auth.getUser()
      .then(async ({ data }) => {
        const u = data?.user;
        if (!u) return;
        const dn = store.getDisplayName();
        setUser({
          name: dn || String(u.user_metadata?.full_name || u.email?.split("@")[0] || "User"),
          email: u.email || "",
        });
        // Fetch avatar dari profiles
        try {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", u.id)
            .single();
          setAvatarUrl(
            profile?.avatar_url || u.user_metadata?.avatar_url || ""
          );
        } catch {
          setAvatarUrl(u.user_metadata?.avatar_url || "");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.ready]);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleSwitchRole(newRole: "buyer" | "dealer") {
    if (role === newRole || switchingRole) return;
    setSwitchingRole(true);
    try {
      const ok = await switchRole(newRole);
      if (ok) {
        toast(
          `Peran berhasil dialihkan ke Mode ${newRole === "dealer" ? "Penjual (Dealer)" : "Pembeli (Buyer)"}.`
        );
        flash();
      } else {
        toast("Gagal mengubah peran. Coba lagi.");
      }
    } catch {
      toast("Terjadi kesalahan saat mengubah peran.");
    } finally {
      setSwitchingRole(false);
    }
  }

  function onDisplayName(v: string) {
    setDisplayName(v);
    if (dnTimer.current) clearTimeout(dnTimer.current);
    dnTimer.current = setTimeout(() => {
      const name = v.trim().slice(0, 40);
      if (!name) {
        store.setDisplayName("");
        window.dispatchEvent(new CustomEvent("displayname-updated", { detail: "" }));
        toast("Nama tampilan dikembalikan ke nama akun.");
        flash();
        return;
      }
      if (name.length < 2) return;
      store.setDisplayName(name);
      window.dispatchEvent(new CustomEvent("displayname-updated", { detail: name }));
      flash();
    }, 600);
  }

  function saveDisplayNameNow() {
    if (dnTimer.current) clearTimeout(dnTimer.current);
    const name = displayName.trim().slice(0, 40);
    if (!name) {
      store.setDisplayName("");
      window.dispatchEvent(new CustomEvent("displayname-updated", { detail: "" }));
      toast("Nama tampilan dikembalikan ke nama akun.");
      flash();
      return;
    }
    if (name.length < 2) {
      toast("Nama tampilan minimal 2 karakter.");
      return;
    }
    store.setDisplayName(name);
    window.dispatchEvent(new CustomEvent("displayname-updated", { detail: name }));
    toast(`Nama tampilan disimpan: ${name}.`);
    flash();
  }

  function onTarget(v: string) {
    const digits = v.replace(/[^\d]/g, "").slice(0, 3);
    setTarget(digits);
    if (tgTimer.current) clearTimeout(tgTimer.current);
    tgTimer.current = setTimeout(() => {
      const n = Math.max(1, Math.min(100, Math.round(Number(digits) || 0)));
      if (!n) return;
      store.setTarget(n);
      setTarget(String(n));
      flash();
    }, 600);
  }

  function saveTargetNow() {
    if (tgTimer.current) clearTimeout(tgTimer.current);
    const n = Math.max(1, Math.min(100, Math.round(Number(target) || 0)));
    if (!n) {
      toast("Target minimal 1.");
      return;
    }
    store.setTarget(n);
    setTarget(String(n));
    toast("Target penjualan disimpan.");
    flash();
  }

  const hidden = store.getHiddenWidgets();
  const visible = WIDGETS.filter((w) => !hidden.includes(w.id)).length;
  const s = store.stats();
  const soldMonth = store.soldThisMonth();
  const targetNum = store.getTarget();
  const sisa = Math.max(0, targetNum - soldMonth);
  const avatarInitial = (displayName.trim() || user.name || "U").trim().charAt(0).toUpperCase() || "U";

  const targetBtn = (on: boolean) =>
    `rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
      on
        ? "border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-zinc-950"
        : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
    }`;

  const themeBtn = (on: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
      on
        ? "border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-white dark:bg-white dark:text-zinc-950"
        : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const effectiveTheme = theme === "dark" || theme === "light" ? theme : "system";

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl dark:text-white">
            Pengaturan Akun
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Kelola peran, profil tampilan, preferensi antarmuka, dan data akun Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={role} />
          <SavedBadge show={saved} />
        </div>
      </div>

      {/* SECTION: GANTI PERAN (PEMBELI / PENJUAL) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-200 p-6 dark:border-zinc-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-700 dark:text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Peran Akun
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                Pilih mode kerja Anda di platform. Menu dan hak akses akan langsung menyesuaikan secara instan.
              </p>
            </div>
            {role !== "admin" && (
              <span className="self-start sm:self-auto rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                Mode saat ini: {role === "dealer" ? "Penjual" : "Pembeli"}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {role === "admin" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Akun Administrator
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Anda memiliki akses penuh ke seluruh fitur pembeli, penjual, dan pengelolaan sistem platform.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Opsi 1: Mode Pembeli */}
              <button
                type="button"
                onClick={() => handleSwitchRole("buyer")}
                disabled={switchingRole || role === "buyer"}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-5 text-left transition-all ${
                  role === "buyer"
                    ? "border-black bg-zinc-50/60 shadow-xs dark:border-white dark:bg-zinc-800/40"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                      </svg>
                    </div>
                    {role === "buyer" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-black">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 hover:text-black dark:text-zinc-400">
                        {switchingRole ? "Memproses..." : "Pilih Mode Ini →"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-black dark:text-white">
                    Mode Pembeli
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
                    Jelajahi ribuan pilihan mobil, simpan favorit, lakukan penawaran harga, dan hubungi langsung penjual melalui WhatsApp.
                  </p>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-3 dark:border-zinc-800">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                    Akses menu: Beli Mobil, Favorit, Riwayat Transaksi
                  </p>
                </div>
              </button>

              {/* Opsi 2: Mode Penjual */}
              <button
                type="button"
                onClick={() => handleSwitchRole("dealer")}
                disabled={switchingRole || role === "dealer"}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-5 text-left transition-all ${
                  role === "dealer"
                    ? "border-black bg-zinc-50/60 shadow-xs dark:border-white dark:bg-zinc-800/40"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    {role === "dealer" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-black">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 hover:text-black dark:text-zinc-400">
                        {switchingRole ? "Memproses..." : "Pilih Mode Ini →"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-black dark:text-white">
                    Mode Penjual (Dealer)
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
                    Pasang iklan mobil Anda, atur inventaris, terima dan kelola tawaran masuk, serta pantau analitik performa penjualan.
                  </p>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-3 dark:border-zinc-800">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                    Akses menu: Dashboard Analitik, Jual Mobil, Beli Mobil
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GRID PENGATURAN LAINNYA */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* KARTU PROFIL TAMPILAN */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-bold text-black dark:text-white">Profil & Tampilan</h2>
          <p className="mt-1 mb-4 text-xs text-gray-500 dark:text-zinc-400">
            Nama sapaan yang muncul di header dan dashboard.
          </p>

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black ring-2 ring-gray-200 dark:bg-white dark:ring-zinc-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white dark:text-zinc-950">
                  {avatarInitial}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-black dark:text-white">{displayName || user.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                store.setDisplayName("");
                setDisplayName("");
                window.dispatchEvent(new CustomEvent("displayname-updated", { detail: "" }));
                toast("Nama tampilan dikembalikan ke nama akun.");
                flash();
              }}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
            >
              Reset
            </button>
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Nama Tampilan
          </label>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => onDisplayName(e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="cth: Budi Santoso"
              autoComplete="nickname"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
            />
            <button
              type="button"
              onClick={saveDisplayNameNow}
              className="shrink-0 rounded-xl bg-black px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Simpan
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400 dark:text-zinc-500">
            Tersimpan otomatis saat diketik atau klik tombol Simpan.
          </p>
        </div>

        {/* KARTU TARGET PENJUALAN (Khusus Dealer & Admin) */}
        {role !== "buyer" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-black dark:text-white">Target Penjualan Bulanan</h2>
            <p className="mt-1 mb-4 text-xs text-gray-500 dark:text-zinc-400">
              Tentukan target penjualan unit mobil untuk monitoring performa.
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    store.setTarget(n);
                    setTarget(String(n));
                    flash();
                  }}
                  className={targetBtn(Number(target) === n)}
                >
                  {n} mobil
                </button>
              ))}
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Target per bulan (unit)
            </label>
            <div className="flex gap-2">
              <input
                value={target}
                onChange={(e) => onTarget(e.target.value)}
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
              />
              <button
                type="button"
                onClick={saveTargetNow}
                className="shrink-0 rounded-xl bg-black px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Simpan
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
              {sisa === 0
                ? `🎉 Target ${targetNum} unit tercapai bulan ini!`
                : `${soldMonth}/${targetNum} terjual bulan ini — ${sisa} lagi menuju target.`}
            </p>
          </div>
        )}

        {/* KARTU TEMA WARNA */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-bold text-black dark:text-white">Tema Tampilan</h2>
          <p className="mt-1 mb-4 text-xs text-gray-500 dark:text-zinc-400">
            Pilih mode terang, gelap, atau ikuti preferensi sistem perangkat.
          </p>

          <div className="flex flex-col sm:flex-row gap-2" role="radiogroup" aria-label="Pilih tema">
            <button
              type="button"
              onClick={() => setTheme("light")}
              role="radio"
              aria-checked={effectiveTheme === "light"}
              className={themeBtn(effectiveTheme === "light")}
            >
              <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Mode Terang
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              role="radio"
              aria-checked={effectiveTheme === "dark"}
              className={themeBtn(effectiveTheme === "dark")}
            >
              <svg className="h-4 w-4 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Mode Gelap
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              role="radio"
              aria-checked={effectiveTheme === "system"}
              className={themeBtn(effectiveTheme === "system")}
            >
              <svg className="h-4 w-4 shrink-0 text-gray-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sistem
            </button>
          </div>
        </div>

        {/* KARTU WIDGET DASHBOARD */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-black dark:text-white">Widget Dashboard</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                Pilih widget statistik yang ingin ditampilkan pada dashboard.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {visible}/{WIDGETS.length} aktif
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {WIDGETS.map((w) => {
              const shown = !hidden.includes(w.id);
              return (
                <label
                  key={w.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                >
                  <input
                    type="checkbox"
                    checked={shown}
                    onChange={() => {
                      store.setWidgetHidden(w.id, shown);
                      flash();
                    }}
                    className="h-4 w-4 rounded accent-black dark:accent-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-black dark:text-white">{w.label}</span>
                    <span className="block text-[11px] text-gray-500 dark:text-zinc-400">{w.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                store.showAllWidgets();
                toast("Semua widget ditampilkan.");
                flash();
              }}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Tampilkan Semua
            </button>
            <button
              type="button"
              onClick={() => {
                WIDGETS.forEach((w) => store.setWidgetHidden(w.id, true));
                toast("Semua widget disembunyikan.");
                flash();
              }}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Sembunyikan Semua
            </button>
          </div>
        </div>

        {/* KARTU DATA & AKUN (LOGOUT & RESET) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-bold text-black dark:text-white">Aksi Akun & Sesi</h2>
          <p className="mt-1 mb-4 text-xs text-gray-500 dark:text-zinc-400">
            Kelola sesi masuk atau bersihkan cache penyimpanan lokal di perangkat ini.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">
                Keluar dari AutoBuyCars
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Mengakhiri sesi di perangkat ini dan kembali ke halaman login.
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-97 shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar Akun
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-zinc-800">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {s.total} listing • {s.favCount} favorit • {store.history().length} catatan riwayat
            </p>
            <button
              type="button"
              onClick={() => {
                if (!confirm("Hapus semua data riwayat & listing lokal akun ini di perangkat ini?")) return;
                store.reset();
                toast("Data lokal perangkat dibersihkan.");
              }}
              className="text-xs font-semibold text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Bersihkan Cache Lokal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
