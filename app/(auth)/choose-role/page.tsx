"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  {
    id: "buyer",
    label: "Pembeli",
    desc: "Cari & beli mobil",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: "dealer",
    label: "Penjual",
    desc: "Jual & kelola listing",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l7.414 7.414a1 1 0 010 1.414l-5.586 5.586a1 1 0 01-1.414 0L5.293 10.293A1 1 0 015 9.586V4a1 1 0 011-1z"
        />
      </svg>
    ),
  },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function choose(role: string) {
    setSelected(role);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Simpan role ke profiles (dealer atau buyer)
      try {
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: user.id,
          role,
          display_name:
            user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          verified: role === "buyer",
          updated_at: new Date().toISOString(),
        });
        if (upsertError) {
          console.warn("Upsert profile error:", upsertError.message);
        }
      } catch (err) {
        console.warn("Upsert profile exception:", err);
      }

      // Simpan role ke localStorage sebagai backup
      try {
        localStorage.setItem(`abc_role_${user.id}`, role);
      } catch {
        /* localStorage tidak tersedia */
      }

      const target = role === "dealer" ? "/dashboard" : "/beli";
      router.replace(target);
      router.refresh();
    } catch {
      router.replace("/beli");
    }
  }

  return (
    <AuthShell
      title="Pilih Peran Anda"
      subtitle="Anda bisa mengubahnya nanti di pengaturan."
    >
      <div className="space-y-3">
        {ROLES.map((r) => {
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              onClick={() => choose(r.id)}
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition disabled:opacity-60 ${
                active
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-gray-200 bg-white hover:border-gray-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                  active
                    ? "bg-white/20 dark:bg-black/20"
                    : "bg-gray-100 text-black dark:bg-zinc-800 dark:text-white"
                }`}
              >
                {r.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{r.label}</p>
                <p
                  className={`text-sm ${active ? "text-white/70 dark:text-zinc-950/60" : "text-gray-500 dark:text-zinc-400"}`}
                >
                  {r.desc}
                </p>
              </div>
              {active && loading ? (
                <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-950/30 dark:border-t-zinc-950" />
              ) : (
                <svg
                  className={`h-5 w-5 shrink-0 ${active ? "" : "text-gray-400 dark:text-zinc-600"}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {
          setSelected("buyer");
          choose("buyer");
        }}
        disabled={loading}
        className="mt-6 w-full text-center text-sm text-gray-500 hover:text-black dark:text-zinc-500 dark:hover:text-white"
      >
        Lewati, langsung masuk
      </button>
    </AuthShell>
  );
}
