"use client";

import { repairLegacyAvatarSession } from "@/lib/supabase/session-hygiene";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";

function EyeIcon({ off = false }: { off?: boolean }) {
  if (off)
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    );
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [emailInput, setEmailInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");

  React.useEffect(() => {
    if (new URL(window.location.href).searchParams.get("error") === "auth_callback") {
      setError("Tautan masuk tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.");
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) {
          await repairLegacyAvatarSession(supabase, data.user);
          if (cancelled) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          if (cancelled) return;
          const role = profile?.role;
          if (["admin", "dealer"].includes(role)) {
            router.replace("/dashboard");
          } else {
            router.replace("/beli");
          }
        }
      } catch {
        // Abaikan error, form tetap tampil
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = emailInput.trim();
    const password = passwordInput;
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(friendlyError(error));
        return;
      }
      // Cek role user untuk redirect yang tepat
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await repairLegacyAvatarSession(supabase, user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const role = profile?.role;
        if (["admin", "dealer"].includes(role)) {
          router.replace("/dashboard");
        } else {
          router.replace("/beli");
        }
      } else {
        router.replace("/beli");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error("OAuth error:", error);
        setError(friendlyError(error));
        setGoogleLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(`Error: ${err instanceof Error ? err.message : "Terjadi kesalahan saat login dengan Google."}`);
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title="Selamat Datang Kembali"
      subtitle="Masuk untuk menyimpan favorit, mencoba simulasi kredit, dan melihat riwayat aktivitas."
      badge="Marketplace Mobil Indonesia"
    >
      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-medium text-red-700 backdrop-blur-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
        >
          <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Input Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
            Alamat Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-gray-200/90 bg-white/90 pl-10 pr-4 py-2.5 text-sm text-gray-900 shadow-2xs transition-all placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white/15"
            />
          </div>
        </div>

        {/* Input Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-gray-600 transition-colors hover:text-black hover:underline dark:text-zinc-400 dark:hover:text-white"
            >
              Lupa sandi?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200/90 bg-white/90 pl-10 pr-11 py-2.5 text-sm text-gray-900 shadow-2xs transition-all placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white/15"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition hover:text-gray-600 active:scale-90 focus:outline-none dark:hover:text-zinc-200"
            >
              <EyeIcon off={showPw} />
            </button>
          </div>
        </div>

        {/* Tombol Submit Masuk */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-97 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Akun</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/80 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white/90 px-3 text-gray-500 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-400">
            atau lanjut dengan
          </span>
        </div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200/90 bg-white/95 py-2.5 px-4 text-xs font-bold text-gray-700 shadow-2xs transition-all hover:bg-gray-50/80 hover:border-gray-300 active:scale-97 disabled:opacity-65 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span>{googleLoading ? "Menghubungkan..." : "Masuk dengan Akun Google"}</span>
      </button>

      {/* Footer Navigation */}
      <div className="mt-5 space-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
        <p className="text-center text-xs text-gray-600 dark:text-zinc-400">
          Belum memiliki akun?{" "}
          <Link href="/register" className="font-bold text-black hover:underline dark:text-white">
            Daftar Pembeli Baru
          </Link>
        </p>

        <Link
          href="/beli"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2.5 text-center text-xs font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50/60 active:scale-98 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        >
          <span>Jelajahi Katalog Mobil Tanpa Masuk</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </AuthShell>
  );
}
