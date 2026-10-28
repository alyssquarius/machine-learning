"use client";

import { useChatNotifications } from "./chat-notifications";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CarLogo } from "@/components/auth-shell";
import { HistText } from "@/components/hist-text";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpDialog } from "@/components/help-dialog";
import { RoleBadge } from "@/components/role-badge";
import { useStore } from "@/components/store-provider";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/roles";
import { useRole } from "@/components/role-provider";

const ALL_NAV = [
  { href: "/chat", label: "Chat", icon: "chat", roles: ["admin", "buyer"] },
  { href: "/profil", label: "Profil Saya", icon: "user", roles: ["admin", "buyer"] },
  { href: "/simulasi", label: "Simulasi Kredit", icon: "calculator", roles: ["admin", "buyer", "guest"] },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "home",
    roles: ["admin"],
  },
  {
    href: "/jual",
    label: "Jual Mobil",
    icon: "tag",
    roles: ["admin"],
  },
  {
    href: "/beli",
    label: "Beli Mobil",
    icon: "cart",
    roles: ["admin", "buyer", "guest"],
  },
  {
    href: "/favorit",
    label: "Favorit",
    icon: "heart",
    roles: ["admin", "buyer"],
  },
  {
    href: "/riwayat",
    label: "Riwayat",
    icon: "history",
    roles: ["admin", "buyer"],
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: "cog",
    roles: ["admin", "buyer"],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const { user, role, authChecked, logout } = useRole();
  const [mobileViewport, setMobileViewport] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = React.useState("");
  const [liveDisplayName, setLiveDisplayName] = React.useState("");
  const workspaceBodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    workspaceBodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setUserOpen(false);
    setNotifOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => { setMobileViewport(media.matches); if (!media.matches) setMobileOpen(false); };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
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
  let isCleared = false;
  try {
    isCleared = typeof window !== "undefined" && !!user?.id && localStorage.getItem(`abc_avatar_cleared_${user.id}`) === "true";
  } catch {
    // Storage may be blocked in Safari; rendering must still succeed.
  }
  const rawMetaAvatar = String(user?.user_metadata?.avatar_url || "");
  const safeMetaAvatar = rawMetaAvatar.startsWith("data:") ? "" : rawMetaAvatar;
  const avatarUrl = profileAvatarUrl || (isCleared ? "" : safeMetaAvatar);
  const initial = isGuest
    ? "G"
    : (displayName || "U").trim().charAt(0).toUpperCase() || "U";
  const favCount = store.stats().favCount;
  const chat = useChatNotifications();
  const unread = store.unreadCount() + chat.unread;
  const notifs = store.history().slice(0, 3);

  // Filter NAV sesuai role
  const NAV = ALL_NAV.filter((n) => n.roles.includes(role)).map(n => (role === "buyer" || role === "guest") ? {...n, label: ({"/beli":"Cari Mobil","/favorit":"Mobil Favorit","/simulasi":"Hitung Cicilan","/chat":"Chat Admin","/riwayat":"Aktivitas Saya"} as Record<string,string>)[n.href] || n.label} : n).sort((a, b) => ["/dashboard", "/beli", "/jual", "/favorit", "/riwayat", "/simulasi", "/chat", "/profil", "/pengaturan"].indexOf(a.href) - ["/dashboard", "/beli", "/jual", "/favorit", "/riwayat", "/simulasi", "/chat", "/profil", "/pengaturan"].indexOf(b.href));

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

  const defaultHref = ["admin"].includes(role) ? "/dashboard" : "/beli";
  const activeHref =
    NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
      ?.href || defaultHref;

  const buyerView = role === "buyer" || role === "guest";
  const buyerLinks = [{href:"/beli",label:"Cari Mobil",icon:"search"},{href:"/favorit",label:"Favorit",icon:"heart"},{href:"/chat",label:"Chat",icon:"chat"},{href:"/profil",label:"Akun",icon:"user"}];
  const pageTitle = NAV.find(n => pathname.startsWith(n.href))?.label || "AutoBuyCars";
  return (
    <div className={`workspace ${buyerView ? "buyer-shell" : ""}`}>
      <a href="#main-content" className="skip-link">Lewati ke konten</a>
      {!buyerView && mobileOpen ? <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} /> : null}
      {!buyerView && <aside id="sidebar" inert={mobileViewport && !mobileOpen} aria-hidden={mobileViewport && !mobileOpen ? true : undefined} className={`workspace-sidebar ${mobileOpen ? "mobile-open" : ""} ${collapsed ? "sidebar-collapsed" : ""}`} aria-label="Navigasi utama">
        <Link href={defaultHref} className="brand-wrap"><span className="brand-symbol"><CarLogo className="h-6 w-6" /></span><span className="brand-text"><strong>AutoBuyCars<span>.</span></strong><small>YOUR NEXT CHAPTER</small></span></Link>
        <button type="button" className="absolute right-3 top-[27px] rounded-lg p-1 text-sky-700 dark:text-sky-300 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi"><Icon name="x" className="h-4 w-4" /></button><div className="sidebar-divider" />
        <p className="sidebar-label brand-text">WORKSPACE</p>
        <nav>{NAV.map(n => <Link key={n.href} href={n.href} title={n.label} aria-current={activeHref === n.href ? "page" : undefined} onClick={() => setMobileOpen(false)} className={`sidebar-link ${activeHref === n.href ? "is-active" : ""}`}><Icon name={n.icon} className="h-[19px] w-[19px] shrink-0" /><span className="nav-label">{n.label}</span>{n.href === "/favorit" && favCount > 0 ? <span className="nav-count">{favCount}</span> : null}{n.href === "/chat" && chat.unread > 0 ? <span className="nav-count">{chat.unread}</span> : null}{activeHref === n.href ? <span className="nav-indicator" /> : null}</Link>)}</nav>
        <div className="sidebar-bottom brand-text"><div className="sidebar-support"><span className="support-spark">✦</span><h3>Perjalanan dimulai di sini.</h3><p>{isGuest ? "Temukan mobil yang sesuai dengan rencana dan gaya hidupmu." : "Satu tempat untuk setiap langkah perjalanan otomotifmu."}</p><button onClick={() => setHelpOpen(true)}>Kenali fitur <Icon name="arrow" className="h-4 w-4" /></button></div><div className="sidebar-account"><span className="account-dot" /><span>{role === "admin" ? "Workspace Administrator" : isGuest ? "Mode Pengunjung" : "Akun Pembeli"}</span></div></div>
      </aside>}
      <div ref={workspaceBodyRef} className="workspace-body" inert={!buyerView && mobileViewport && mobileOpen}>
        <header className="workspace-header">{buyerView ? <div className="buyer-header-main"><Link href="/beli" className="buyer-brand" aria-label="AutoBuyCars — Cari Mobil"><span className="brand-symbol"><CarLogo className="h-6 w-6" /></span><strong>AutoBuyCars<span>.</span></strong></Link><nav className="buyer-top-nav" aria-label="Menu pembeli">{buyerLinks.slice(0,3).map(n=><Link key={n.href} href={n.href} aria-current={pathname===n.href ? "page" : undefined}>{n.label}</Link>)}<Link href="/simulasi" aria-current={pathname==="/simulasi" ? "page" : undefined}>Hitung Cicilan</Link></nav></div> : <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={toggleSidebar} className="icon-button" aria-label="Buka atau tutup navigasi" aria-expanded={mobileViewport ? mobileOpen : !collapsed} aria-controls="sidebar"><Icon name="menu" /></button><div className="header-breadcrumb hidden sm:flex"><span>Workspace</span><span>/</span><strong>{pageTitle}</strong></div></div>}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3"><form className={`header-search hidden ${buyerView ? "" : "md:flex"}`} onSubmit={event => { event.preventDefault(); router.push(`/beli?q=${encodeURIComponent(searchRef.current?.value.trim() || "")}`); }}><Icon name="search" className="h-4 w-4" /><input ref={searchRef} aria-label="Cari mobil di katalog" type="search" placeholder="Cari mobil impianmu..." /><kbd>⌘ K</kbd></form><ThemeToggle className="header-theme" />
            <div className="relative"><button type="button" id="notif-button" aria-label="Buka notifikasi" aria-controls="notif-menu" aria-expanded={notifOpen} className="icon-button relative" onClick={event => { event.stopPropagation(); setUserOpen(false); setNotifOpen(!notifOpen); }}><Icon name="bell" />{unread ? <span className="notification-dot" /> : null}</button>{notifOpen ? <div id="notif-menu" className="header-dropdown notification-menu"><div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-zinc-800"><h3 className="text-sm font-bold">Notifikasi</h3><button className="text-xs font-medium text-emerald-700 dark:text-emerald-400" onClick={() => store.markNotifsRead()}>Tandai dibaca</button></div><ul className="max-h-72 overflow-y-auto p-4">{chat.unread > 0 ? <li><Link href="/chat" className="dropdown-link"><Icon name="chat" />{chat.unread} pesan chat belum dibaca</Link></li> : null}{notifs.length ? notifs.map(h => <li key={h.id} className="border-b border-gray-100 py-3 text-sm last:border-0 dark:border-zinc-800"><HistText text={h.text} /></li>) : chat.unread ? null : <li className="py-7 text-center text-sm text-gray-500"><Icon name="bell" className="mx-auto mb-3 h-6 w-6 text-gray-300" />Belum ada kabar baru.<p className="mt-1 text-xs">Aktivitas akunmu akan tampil di sini.</p></li>}</ul>{!isGuest ? <Link href="/riwayat" onClick={() => setNotifOpen(false)} className="block border-t border-gray-100 p-3 text-center text-xs font-semibold text-emerald-700 dark:border-zinc-800 dark:text-emerald-400">Lihat semua aktivitas →</Link> : null}</div> : null}</div>
            <div className="header-separator" />
            <div className="relative"><button id="user-button" className="account-button" aria-label={`Menu akun ${displayName}`} aria-expanded={userOpen} aria-controls="user-menu" onClick={event => { event.stopPropagation(); setNotifOpen(false); setUserOpen(!userOpen); }}><span className="header-avatar">{avatarUrl ? <Image src={avatarUrl} alt="Foto profil" width={36} height={36} unoptimized className="h-full w-full object-cover" /> : initial}</span><span className="hidden text-left lg:block"><strong>{displayName}</strong><small>{role === "admin" ? "Administrator" : isGuest ? "Jelajahi katalog" : "Pembeli"}</small></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg></button>{userOpen ? <div id="user-menu" className="header-dropdown account-menu"><div className="border-b border-gray-100 p-4 dark:border-zinc-800"><p className="truncate text-sm font-bold">{displayName}</p><p className="mt-1 truncate text-xs text-gray-500">{email || "Masuk untuk menyimpan pilihanmu"}</p></div><div className="p-2">{isGuest ? <Link href="/login" className="dropdown-link" onClick={() => setUserOpen(false)}><Icon name="user" />Masuk / Daftar</Link> : <><Link href="/profil" onClick={() => setUserOpen(false)} className="dropdown-link"><Icon name="user" />Profil Saya</Link><Link href="/riwayat" onClick={() => setUserOpen(false)} className="dropdown-link"><Icon name="history" />Aktivitas Saya</Link><Link href="/simulasi" onClick={() => setUserOpen(false)} className="dropdown-link"><Icon name="calculator" />Hitung Cicilan</Link><Link href="/pengaturan" onClick={() => setUserOpen(false)} className="dropdown-link"><Icon name="cog" />Pengaturan</Link><button onClick={logout} className="dropdown-link text-red-600"><Icon name="logout" />Keluar dari akun</button></>}</div></div> : null}</div>
          </div>
        </header>
        <main id="main-content" className="app-content" tabIndex={-1}>{!authChecked ? <div className="workspace-loading" role="status"><span className="loading-mark"><CarLogo className="h-7 w-7" /></span><p>Menyiapkan halaman…</p></div> : <div key={pathname} className="animate-page-enter">{children}</div>}<footer className="workspace-footer"><span>© {new Date().getFullYear()} AutoBuyCars<span className="hidden sm:inline"> · Temukan mobil pilihanmu.</span></span><div><button onClick={() => setHelpOpen(true)}>Panduan & bantuan</button><span className="footer-status"><i />Ruang otomotifmu</span></div></footer></main>
      </div>
      {buyerView && <nav className="buyer-bottom-nav" aria-label="Menu utama pembeli">{buyerLinks.map(n=><Link key={n.href} href={n.href} aria-current={pathname===n.href || (n.href==='/profil' && ['/pengaturan','/riwayat'].includes(pathname)) ? 'page' : undefined}><Icon name={n.icon} className="h-5 w-5"/><span>{n.label}</span>{n.href==='/favorit' && favCount>0 ? <small aria-label={`${favCount} mobil favorit`}>{favCount}</small> : null}</Link>)}</nav>}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
