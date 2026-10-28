"use client";

import * as React from "react";
import { useStore } from "@/components/store-provider";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/components/role-provider";
import { useToast } from "@/components/toast";
import { WhatsAppContact } from "@/components/whatsapp-contact";
import { config } from "@/lib/config";
import { AvatarUpload } from "@/components/avatar-upload";

export default function ProfilPage() {
  const store = useStore();
  const { toast } = useToast();
  const { user } = useRole();
  const [profileError, setProfileError] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user || !store.ready) return;
    let cancelled = false;
    const userId = user.id;
    setProfileError("");
    setDisplayName(store.getDisplayName() || user.user_metadata?.full_name || "");
    const metadataAvatar = String(user.user_metadata?.avatar_url || "");
    let cachedAvatar = "";
    let cleared = false;
    try {
      cachedAvatar = localStorage.getItem(`abc_avatar_${userId}`) || "";
      cleared = localStorage.getItem(`abc_avatar_cleared_${userId}`) === "true";
    } catch {
      // Safari may disallow storage; the database remains available.
    }
    setAvatarUrl(cachedAvatar || (!cleared && !metadataAvatar.startsWith("data:") ? metadataAvatar : ""));

    void (async () => {
      try {
        const { data: profile, error } = await createClient().from("profiles")
          .select("avatar_url").eq("id", userId).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (profile) {
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
        if (!cancelled) setProfileError("Foto profil belum dapat dimuat. Silakan muat ulang halaman untuk mencoba lagi.");
      }
    })();
    return () => { cancelled = true; };
    // Store snapshots change while typing/saving; load only when the account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, store.ready]);

  React.useEffect(() => {
    const onAvatarUpdated = (event: Event) => setAvatarUrl((event as CustomEvent<string>).detail || "");
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated);
  }, []);

  async function onSave() {
    if (!displayName.trim()) {
      toast("Nama tidak boleh kosong.");
      return;
    }
    setLoading(true);
    try {
      store.setDisplayName(displayName.trim());
      window.dispatchEvent(new CustomEvent("displayname-updated", { detail: displayName.trim() }));
      toast("Profil diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  const email = user?.email || "";
  const initial = (displayName || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl dark:text-white">
          Profil Saya
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Kelola informasi profil dan preferensi tampilan.
        </p>
      </div>

      {profileError ? (
        <p role="alert" className="mb-4 rounded-lg border border-amber-300 p-3 text-sm text-amber-800 dark:border-amber-700 dark:text-amber-300">{profileError}</p>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Foto Profil */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Foto Profil
          </label>
          {user ? (
            <AvatarUpload
              userId={user.id}
              currentUrl={avatarUrl}
              fallbackInitial={initial}
              onUploaded={(url) => setAvatarUrl(url)}
              size={80}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black dark:bg-white">
              <span className="text-2xl font-bold text-white dark:text-zinc-950">{initial}</span>
            </div>
          )}
        </div>

        {/* Info user */}
        <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">{displayName || "User"}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Nama Tampilan
            </label>
            <input
              id="profile-name"
              maxLength={40}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama yang ditampilkan di profil"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
          </div>

          <button
            onClick={onSave}
            disabled={loading}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-70 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Butuh Bantuan?
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
          Hubungi customer service kami melalui WhatsApp untuk informasi lebih lanjut tentang AutoBuyCars.
        </p>
        <WhatsAppContact
          phoneNumber={config.whatsapp.phoneNumber}
          message={`Halo, saya ${displayName || "pengguna AutoBuyCars"} (${email}). Saya ingin bertanya tentang...`}
        />
      </div>
    </div>
  );
}
