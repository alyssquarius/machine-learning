"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLES, getRoleDisplayName, getRoleDescription } from "@/lib/roles";

const ROLE_OPTIONS = [
  {
    role: ROLES.BUYER,
    icon: "🚗",
    title: "Pembeli",
    description: "Saya ingin membeli mobil",
    features: ["Browse mobil", "Ajukan penawaran", "Beli mobil", "Kontak penjual"],
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500 dark:border-cyan-500",
  },
  {
    role: ROLES.DEALER,
    icon: "🏪",
    title: "Dealer/Penjual",
    description: "Saya ingin menjual mobil",
    features: ["Buat listing", "Kelola penjualan", "Terima penawaran", "Analytics"],
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500 dark:border-pink-500",
    badge: "Perlu Verifikasi",
  },
];

export default function ChooseRolePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        router.replace("/login");
        return;
      }
      
      setUser(data.user);
      
      // Cek apakah user sudah punya role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      
      if (profile?.role) {
        router.replace("/dashboard");
      }
    }
    
    checkAuth();
  }, [router]);

  async function selectRole(role: string) {
    setLoading(role);
    setError("");
    
    try {
      const supabase = createClient();
      
      // Simpan role ke profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          role: role,
          display_name: user.user_metadata?.full_name || "",
          verified: role === ROLES.BUYER, // Buyer auto-verified, dealer perlu verifikasi
          updated_at: new Date().toISOString(),
        });
      
      if (updateError) {
        setError("Gagal menyimpan pilihan. Silakan coba lagi.");
        console.error(updateError);
        setLoading(null);
        return;
      }
      
      // Redirect berdasarkan role
      if (role === ROLES.DEALER) {
        router.replace("/dashboard?welcome=dealer");
      } else {
        router.replace("/dashboard?welcome=buyer");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error(err);
      setLoading(null);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-zinc-800 dark:border-t-white" />
          <p className="mt-4 text-sm text-gray-600 dark:text-zinc-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-black to-gray-700 text-3xl dark:from-white dark:to-gray-300">
            🎯
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
            Selamat Datang di AutoBuyCars!
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-zinc-400">
            Pilih peran Anda untuk memulai
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Role Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.role}
              onClick={() => selectRole(option.role)}
              disabled={loading !== null}
              className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-8 text-left shadow-lg transition-all hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 ${
                loading === option.role
                  ? option.borderColor
                  : "border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10 ${option.color}`} />
              
              {/* Badge */}
              {option.badge && (
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {option.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-4xl shadow-lg ${option.color}`}>
                {option.icon}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-2xl font-bold text-black dark:text-white">
                {option.title}
              </h3>

              {/* Description */}
              <p className="mb-6 text-gray-600 dark:text-zinc-400">
                {option.description}
              </p>

              {/* Features */}
              <ul className="mb-6 space-y-2">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                    <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <div className={`flex items-center justify-between rounded-lg bg-gradient-to-r p-4 text-white ${option.color}`}>
                <span className="font-semibold">
                  {loading === option.role ? "Menyimpan..." : "Pilih Peran Ini"}
                </span>
                {loading === option.role ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            Anda bisa mengubah peran nanti di pengaturan akun
          </p>
        </div>
      </div>
    </div>
  );
}
