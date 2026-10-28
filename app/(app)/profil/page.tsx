"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/components/role-provider";
import { useToast } from "@/components/toast";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { RoleBadge } from "@/components/role-badge";
import { AvatarUpload } from "@/components/avatar-upload";

export default function ProfilPage() {
  const store = useStore();
  const { toast } = useToast();
  const { user, role } = useRole();
  const [profileError, setProfileError] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user || !store.ready) return;
    let cancelled = false;
    const userId = user.id;
    setProfileError("");
    const initialName =
      store.getDisplayName() || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    setDisplayName(initialName);
    const metadataAvatar = String(user.user_metadata?.avatar_url || "");
    let cachedAvatar = "";
    let cleared = false;
    try {
      cachedAvatar = localStorage.getItem(`abc_avatar_${userId}`) || "";
      cleared = localStorage.getItem(`abc_avatar_cleared_${userId}`) === "true";
    } catch {
      // Safari may disallow storage; the database remains available.
    }
    setAvatarUrl(
      cachedAvatar || (!cleared && !metadataAvatar.startsWith("data:") ? metadataAvatar : ""),
    );

    void (async () => {
      try {
        const { data: profile, error } = await createClient()
          .from("profiles")
          .select("avatar_url, display_name")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (profile) {
          if (profile.display_name && !store.getDisplayName()) {
            setDisplayName((current) => (current === initialName ? profile.display_name : current));
          }
          const avatar = profile.avatar_url || "";
          setAvatarUrl(avatar);
          try {
            if (avatar) {
              localStorage.setItem(`abc_avatar_${userId}`, avatar);
              localStorage.removeItem(`abc_avatar_cleared_${userId}`);
            } else {
              localStorage.removeItem(`abc_avatar_${userId}`);
              localStorage.setItem(`abc_avatar_cleared_${userId}`, "true");
            }
          } catch {
            // Cache is optional.
          }
        }
      } catch {
        if (!cancelled)
          setProfileError(
            "Foto profil belum dapat dimuat. Silakan muat ulang halaman untuk mencoba lagi.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
    // Store snapshots change while typing/saving; load only when the account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, store.ready]);

  React.useEffect(() => {
    const onAvatarUpdated = (event: Event) =>
      setAvatarUrl((event as CustomEvent<string>).detail || "");
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated);
  }, []);

  async function onSave() {
    if (!displayName.trim()) {
      toast("Nama tidak boleh kosong.");
      return;
    }
    if (!user) return toast("Silakan masuk kembali untuk menyimpan profil.");
    setLoading(true);
    try {
      const name = displayName.trim().slice(0, 40);
      const { error } = await createClient()
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: name,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      store.setDisplayName(name);
      window.dispatchEvent(new CustomEvent("displayname-updated", { detail: displayName.trim() }));
      toast("Profil diperbarui.");
    } catch {
      toast("Profil belum tersimpan. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const email = user?.email || "";
  const initial = (displayName || "U").trim().charAt(0).toUpperCase();

  return (
    <div>
      <PageHeader
        eyebrow="RUANG PERSONAL"
        title="Profil Saya"
        description="Kelola informasi dan foto akunmu."
      />
      {profileError ? (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {profileError}
        </p>
      ) : null}
      <div className="profile-layout">
        <aside className="space-y-5">
          <section className="surface overflow-hidden">
            <div className="profile-cover" />
            <div className="px-6 pb-7">
              <div className="profile-avatar-editor -mt-9 mb-5">
                {user ? (
                  <AvatarUpload
                    userId={user.id}
                    currentUrl={avatarUrl}
                    fallbackInitial={initial}
                    onUploaded={setAvatarUrl}
                    size={72}
                  />
                ) : (
                  <span className="soft-icon !h-16 !w-16 text-xl">{initial}</span>
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{displayName || "Akun Saya"}</h2>
              <p className="mb-4 mt-1 break-all text-[11px] text-gray-500 dark:text-zinc-400">
                {email}
              </p>
              <RoleBadge role={role} />
              <div className="mt-6 border-t border-gray-100 pt-5 dark:border-zinc-800">
                <p className="filter-label">WORKSPACE PRIBADI</p>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">
                  Nama dan foto ini membantu mempersonalisasi pengalamanmu di AutoBuyCars.
                </p>
              </div>
            </div>
          </section>
          {role !== "admin" ? (
            <section className="surface p-5">
              <span className="soft-icon mb-3">
                <Icon name="help" />
              </span>
              <h3 className="text-sm font-semibold">Butuh bantuan?</h3>
              <p className="page-description mb-4">
                Hubungi customer service untuk pertanyaan seputar aplikasi.
              </p>
              <Link href="/chat" className="button-primary">
                Chat dengan admin
              </Link>
            </section>
          ) : null}
        </aside>
        <div className="space-y-5">
          <section className="surface p-6 sm:p-8">
            <div className="mb-7 border-b border-gray-100 pb-5 dark:border-zinc-800">
              <p className="eyebrow">INFORMASI DASAR</p>
              <h2 className="text-base font-semibold">Informasi akun</h2>
              <p className="page-description !mt-1">Perbarui nama yang muncul di workspace kamu.</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void onSave();
              }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="profile-name" className="filter-label">
                  Nama tampilan
                </label>
                <input
                  id="profile-name"
                  maxLength={40}
                  required
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nama yang ingin ditampilkan"
                  className="w-full border px-4 py-3 text-sm"
                />
                <p className="mt-2 text-[10px] text-gray-400">
                  Maksimal 40 karakter. Nama akan disimpan ke profil akunmu.
                </p>
              </div>
              <div>
                <label htmlFor="profile-email" className="filter-label">
                  Alamat email
                </label>
                <input
                  id="profile-email"
                  value={email}
                  readOnly
                  type="email"
                  className="w-full border px-4 py-3 text-sm opacity-65"
                />
                <p className="mt-2 text-[10px] text-gray-400">
                  Email digunakan untuk masuk dan menerima informasi akun.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-zinc-800">
                <p className="text-[10px] text-gray-400">
                  Perubahan disimpan setelah kamu menekan tombol.
                </p>
                <button
                  type="submit"
                  disabled={loading || !displayName.trim()}
                  className="button-primary shrink-0 disabled:opacity-50"
                >
                  <Icon name="check" className="h-4 w-4" />
                  {loading ? "Menyimpan…" : "Simpan perubahan"}
                </button>
              </div>
            </form>
          </section>
          <section className="surface flex items-start gap-4 p-6">
            <span className="soft-icon">
              <Icon name="shield" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Akunmu, dalam kendalimu.</h2>
              <p className="page-description !mt-1">
                Ubah tema, pilih mode akun, dan kelola preferensi melalui halaman pengaturan.
              </p>
              <a
                href="/pengaturan"
                className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
              >
                Buka pengaturan
                <Icon name="arrow" className="h-3 w-3" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
