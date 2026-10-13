"use client";

import * as React from "react";
import { useStore } from "@/components/store-provider";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/components/toast";

export default function ProfilPage() {
  const store = useStore();
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setDisplayName(store.getDisplayName() || data.user.user_metadata?.full_name || "");
      }
    });
  }, [store]);

  async function onSave() {
    if (!displayName.trim()) {
      toast("Nama tidak boleh kosong.");
      return;
    }
    setLoading(true);
    try {
      store.setDisplayName(displayName.trim());
      toast("Profil diperbarui.");
    } finally {
      setLoading(false);
    }
  }

  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
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

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-black dark:bg-white">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white dark:text-zinc-950">{initial}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">{displayName || "User"}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Nama Tampilan
            </label>
            <input
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
    </div>
  );
}
