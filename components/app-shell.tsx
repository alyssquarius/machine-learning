"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CarLogo } from "@/components/auth-shell";
import { HistText } from "@/components/hist-text";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleBadge } from "@/components/role-badge";
import { useStore } from "@/components/store-provider";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/roles";
import { useRole } from "@/components/role-provider";

const ALL_NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "home",
    roles: ["admin", "dealer"],
  },
  {
    href: "/jual",
    label: "Jual Mobil",
    icon: "tag",
    roles: ["admin", "dealer"],
  },
  {
    href: "/beli",
    label: "Beli Mobil",
    icon: "cart",
    roles: ["admin", "dealer", "buyer", "guest"],
  },
  {
    href: "/favorit",
    label: "Favorit",
    icon: "heart",
    roles: ["admin", "dealer", "buyer"],
  },
  {
    href: "/riwayat",
    label: "Riwayat",
    icon: "history",
    roles: ["admin", "dealer", "buyer"],
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: "cog",
    roles: ["admin", "dealer", "buyer"],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const { user, role, authChecked, logout } = useRole();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = React.useState("");
  const [liveDisplayName, setLiveDisplayName] = React.useState("");

  // Fetch avatar_url dari profiles
  React.useEffect(() => {
    if (!user) {
      setProfileAvatarUrl("");
      return;
    }

    // Cek cache localStorage terlebih dahulu (bebas latency & flicker)
    try {
      const cached = localStorage.getItem(`abc_avatar_${user.id}`);
      if (cached) {
        setProfileAvatarUrl(cached);
      }
    } catch {}

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (data?.avatar_url) {
          setProfileAvatarUrl(data.avatar_url);
          try {
            localStorage.setItem(`abc_avatar_${user.id}`, data.avatar_url);
            localStorage.removeItem(`abc_avatar_cleared_${user.id}`);
          } catch {}
        } else if (data && data.avatar_url === null) {
          setProfileAvatarUrl("");
          try {
            localStorage.removeItem(`abc_avatar_${user.id}`);
            localStorage.setItem(`abc_avatar_cleared_${user.id}`, "true");
          } catch {}
        }
      } catch {
        /* abaikan */
      }
    })();
  }, [user]);

  // Listen perubahan avatar dari AvatarUpload
  React.useEffect(() => {
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent).detail as string;
      setProfileAvatarUrl(url || "");
    }
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated);
  }, []);

  // Listen perubahan nama tampilan
  React.useEffect(() => {
    setLiveDisplayName(store.getDisplayName());
    function onNameUpdated(e: Event) {
      const name = (e as CustomEvent).detail as string;
      setLiveDisplayName(name);
    }
    window.addEventListener("displayname-updated", onNameUpdated);
    return () => window.removeEventListener("displayname-updated", onNameUpdated);
  }, [store]);

  // Restore collapse desktop
  React.useEffect(() => {
    try {
      if (
        window.matchMedia("(min-width: 1024px)").matches &&
        localStorage.getItem("sidebar-collapsed") === "1"
      ) {
        setCollapsed(true);
      }
    } catch {
      /* abaikan */
    }
  }, []);

  // Tutup dropdown saat klik di luar / Esc
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#notif-menu") && !target.closest("#notif-button")) {
        setNotifOpen(false);
      }
      if (!target.closest("#user-menu") && !target.closest("#user-button")) {
        setUserOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isGuest = !user;
  const displayName = isGuest
    ? "Pengunjung"
    : liveDisplayName ||
      store.getDisplayName() ||
      String(
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
      );
  const email = user?.email || "";
  const isCleared = typeof window !== "undefined" && user?.id ? localStorage.getItem(`abc_avatar_cleared_${user.id}`) === "true" : false;
  const avatarUrl = profileAvatarUrl || (isCleared ? "" : String(user?.user_metadata?.avatar_url || ""));
  const initial = isGuest
    ? "G"
    : (displayName || "U").trim().charAt(0).toUpperCase() || "U";
  const favCount = store.stats().favCount;
  const unread = store.unreadCount();
  const notifs = store.history().slice(0, 3);

  // Filter NAV sesuai role
  const NAV = ALL_NAV.filter((n) => n.roles.includes(role));

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((c) => {
        try {
          localStorage.setItem("sidebar-collapsed", c ? "0" : "1");
        } catch {
          /* abaikan */
        }
        return !c;
      });
    } else {
      setMobileOpen((o) => !o);
    }
  }

  const defaultHref = ["admin", "dealer"].includes(role) ? "/dashboard" : "/beli";
  const activeHref =
    NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
      ?.href || defaultHref;

  return (
    <div className={`flex min-h-screen ${authChecked ? "" : "invisible"}`}>
      {/* Overlay mobile */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "" : "hidden"
        }`}
      />
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950 lg:static ${
          mobileOpen ? "" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="brand-wrap flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <CarLogo className="h-5 w-5" />
            </div>
            <span className="brand-text truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              AutoBuyCars
            </span>
          </div>
        </div>

        {/* Role Badge di Sidebar */}
        <div className="brand-text px-6 py-2">
          <RoleBadge role={role} />
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-4">
          {NAV.map((n) => {
            const on = activeHref === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium active:scale-97 transition-transform ${
                  on ? "nav-active" : "nav-item"
                }`}
              >
                <Icon name={n.icon} className="h-5 w-5 shrink-0" />
                <span className="truncate">{n.label}</span>
                {n.href === "/favorit" && favCount > 0 ? (
                  <span
                    id="nav-fav-count"
                    className="ml-auto shrink-0 rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-950"
                  >
                    {favCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div id="sidebar-tip" className="mt-auto p-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h4 className="mb-1 font-semibold text-black dark:text-white">
              {role === "admin"
                ? "Panel Admin"
                : role === "dealer"
                  ? "Mode Penjual"
                  : role === "buyer"
                    ? "Mode Pembeli"
                    : "Mode Pengunjung"}
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
              {role === "admin"
                ? "Kelola seluruh platform dan verifikasi user."
                : role === "dealer"
                  ? "Upload dan kelola listing mobil jualanmu."
                  : role === "buyer"
                    ? "Cari, tawar, dan beli mobil impianmu."
                    : "Masuk untuk menikmati fitur lengkap."}
            </p>
            {isGuest ? (
              <Link
                href="/login"
                className="block w-full rounded-lg bg-black py-2.5 text-center text-sm font-medium text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Masuk / Daftar
              </Link>
            ) : (
              <Link
                href="/pengaturan"
                className="block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-black transition hover:bg-gray-100 active:scale-97 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                Pengaturan Akun
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-950">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={toggleSidebar}
              title="Buka / tutup sidebar"
              aria-label="Buka / tutup sidebar"
              className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-97 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Icon name="menu" />
            </button>
            <div className="relative w-full max-w-52 group sm:max-w-80">
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
                type="search"
                placeholder="Cari mobil atau dealer..."
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    router.push(
                      `/beli?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`,
                    );
                }}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <RoleBadge role={role} />
            </div>
            <ThemeToggle />
            <div className="relative shrink-0">
              <button
                id="notif-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserOpen(false);
                  setNotifOpen((o) => !o);
                }}
                aria-expanded={notifOpen}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 hover:text-black active:scale-97 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <Icon name="bell" />
                <span
                  className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-zinc-950 ${
                    unread ? "" : "hidden"
                  }`}
                />
              </button>
              <div
                id="notif-menu"
                className={`absolute right-0 z-50 mt-3 w-80 origin-top-right animate-zoom-in rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 ${
                  notifOpen ? "" : "hidden"
                }`}
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-zinc-800">
                  <h3 className="font-semibold text-black dark:text-white">
                    Notifikasi
                  </h3>
                  <button
                    onClick={() => store.markNotifsRead()}
                    className="text-xs font-medium text-gray-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
                  >
                    Tandai dibaca
                  </button>
                </div>
                <ul className="max-h-64 space-y-3 overflow-y-auto">
                  {notifs.length ? (
                    notifs.map((h) => (
                      <li
                        key={h.id}
                        className="text-sm text-gray-600 dark:text-zinc-300"
                      >
                        <HistText text={h.text} />
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-sm text-gray-500 dark:text-zinc-400">
                      Tidak ada notifikasi baru
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block dark:bg-zinc-800" />
            <div className="relative">
              <button
                id="user-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen(false);
                  setUserOpen((o) => !o);
                }}
                aria-expanded={userOpen}
                className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-gray-100 active:scale-97 focus:outline-none dark:hover:bg-zinc-800"
              >
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-black dark:bg-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="User"
                      width={32}
                      height={32}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white dark:text-zinc-950">
                      {initial}
                    </span>
                  )}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block dark:text-zinc-200">
                  {displayName}
                </span>
                <svg
                  className="h-4 w-4 text-gray-500 dark:text-zinc-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div
                id="user-menu"
                className={`absolute right-0 z-50 mt-3 w-56 origin-top-right animate-zoom-in rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 ${
                  userOpen ? "" : "hidden"
                }`}
              >
                {isGuest ? (
                  <>
                    <p className="px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
                      Anda belum masuk
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setUserOpen(false)}
                      className="block rounded-lg bg-black px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-97 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      Masuk / Daftar
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="mb-1 rounded-t-lg border-b border-gray-200 px-3 py-3 dark:border-zinc-800">
                      <p className="truncate font-medium text-black dark:text-white">
                        {displayName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">
                        {email}
                      </p>
                    </div>
                    <Link
                      href="/profil"
                      onClick={() => setUserOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Profil Saya
                    </Link>
                    <Link
                      href="/pengaturan"
                      onClick={() => setUserOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Pengaturan Akun
                    </Link>
                    <div className="my-1 border-t border-gray-200 dark:border-zinc-800" />
                    <button
                      onClick={logout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Keluar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={pathname} className="animate-page-enter">
            {children}
          </div>
          <footer className="clear-both mt-10 flex w-full flex-col gap-4 border-t border-gray-200 pb-2 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left dark:border-zinc-800">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              &copy; 2026 AutoBuyCars. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-gray-500 dark:text-zinc-400">
              <span>Panduan</span>
              <span>Bantuan</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
