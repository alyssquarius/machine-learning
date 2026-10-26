"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/components/store-provider";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { WIDGETS } from "@/lib/market";

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400" role="status">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Tersimpan
    </p>
  );
}

export default function PengaturanPage() {
  const store = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = React.useState(false);
  const [user, setUser] = React.useState({ name: "User", email: "user@example.com" });
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [target, setTarget] = React.useState("10");
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

  async function logout() {
    try {
      await createClient().auth.signOut();
      store.setOwner("");
    } catch {
      /* abaikan */
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const targetBtn = (on: boolean) =>
    `rounded-full border px-4 py-1.5 text-xs font-semibold transition ${on ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"}`;
  const themeBtn = (on: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${on ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-gray-300 text-black hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"}`;

  const effectiveTheme = theme === "dark" || theme === "light" ? theme : "system";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
            Pengaturan
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Semua tersimpan otomatis. Tanpa tombol simpan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SavedBadge show={saved} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 font-bold text-black dark:text-white">Profil</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
            Nama sapaan di banner. Tersimpan otomatis saat diketik.
          </p>
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-black dark:bg-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white dark:text-zinc-950">
                  {avatarInitial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-black dark:text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{user.email}</p>
            </div>
            <button
              onClick={() => {
                store.setDisplayName("");
                setDisplayName("");
                window.dispatchEvent(new CustomEvent("displayname-updated", { detail: "" }));
                toast("Nama tampilan dikembalikan ke nama akun.");
                flash();
              }}
              className="ml-auto shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Pakai nama akun
            </button>
          </div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Nama tampilan
          </label>
          <div className="flex gap-3">
            <input
              value={displayName}
              onChange={(e) => onDisplayName(e.target.value.slice(0, 40))}
              maxLength={40}
              placeholder="cth: Budi"
              autoComplete="nickname"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white"
            />
            <button
              onClick={saveDisplayNameNow}
              className="shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Simpan
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
            Kosongkan untuk kembali memakai nama akun.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 font-bold text-black dark:text-white">Target Penjualan</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
            Target bulanan di banner. Pilih cepat atau ketik sendiri.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {[5, 10, 20, 50].map((n) => (
              <button key={n} onClick={() => { store.setTarget(n); setTarget(String(n)); flash(); }} className={targetBtn(Number(target) === n)}>
                {n} mobil
              </button>
            ))}
          </div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Target per bulan (unit)
          </label>
          <div className="flex gap-3">
            <input
              value={target}
              onChange={(e) => onTarget(e.target.value)}
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
            <button
              onClick={saveTargetNow}
              className="shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Simpan
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
            {sisa === 0 ? `Target ${targetNum} tercapai bulan ini.` : `${soldMonth}/${targetNum} terjual bulan ini — ${sisa} lagi menuju target.`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 font-bold text-black dark:text-white">Tampilan</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
            Langsung diterapkan saat dipilih.
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Pilih tema">
            <button onClick={() => setTheme("light")} role="radio" aria-checked={effectiveTheme === "light"} className={themeBtn(effectiveTheme === "light")}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Terang
            </button>
            <button onClick={() => setTheme("dark")} role="radio" aria-checked={effectiveTheme === "dark"} className={themeBtn(effectiveTheme === "dark")}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Gelap
            </button>
            <button onClick={() => setTheme("system")} role="radio" aria-checked={effectiveTheme === "system"} className={themeBtn(effectiveTheme === "system")}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Otomatis
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h2 className="font-bold text-black dark:text-white">Tampilan Widget</h2>
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
              {visible}/{WIDGETS.length} tampil
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
            Centang = tampil. Perubahan langsung terlihat di dashboard.
          </p>
          <div className="space-y-2">
            {WIDGETS.map((w) => {
              const shown = !hidden.includes(w.id);
              return (
                <label key={w.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
                  <input
                    type="checkbox"
                    checked={shown}
                    onChange={() => {
                      store.setWidgetHidden(w.id, shown);
                      flash();
                    }}
                    className="h-4 w-4 accent-black dark:accent-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-black dark:text-white">{w.label}</span>
                    <span className="block text-xs text-gray-500 dark:text-zinc-400">{w.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { store.showAllWidgets(); toast("Semua widget ditampilkan."); flash(); }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Tampilkan semua
            </button>
            <button
              onClick={() => { WIDGETS.forEach((w) => store.setWidgetHidden(w.id, true)); toast("Semua widget disembunyikan."); flash(); }}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-black dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Sembunyikan semua
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 font-bold text-black dark:text-white">Data Akun</h2>
          <p className="mb-1 text-sm text-gray-500 dark:text-zinc-400">
            Hapus inventaris, favorit, dan riwayat milik akun ini di perangkat ini.
          </p>
          <p className="mb-4 text-xs text-gray-500 dark:text-zinc-400">
            {s.total} listing • {s.favCount} favorit • {store.history().length} riwayat di perangkat ini.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!confirm("Hapus semua data akun ini di perangkat ini?")) return;
                store.reset();
                toast("Data akun dihapus.");
              }}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Hapus Data
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
