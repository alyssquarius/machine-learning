"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { friendlyError } from "@/lib/format";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  React.useEffect(() => {
    if (!getSupabaseConfig()) return;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && !ready)) setReady(true);
    });
    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      // Browser client initialization already exchanges PKCE codes. Await it
      // through getUser instead of consuming the one-time code a second time.
      void supabase.auth.getUser().then(({ data, error }) => {
        if (error || !data.user) setExpired(true);
        else {
          setReady(true);
          window.history.replaceState({}, "", "/reset-password");
        }
      }).catch(() => setExpired(true));
    }
    const t = setTimeout(() => {
      setReady((r) => {
        if (!r) setExpired(true);
        return r;
      });
    }, 2500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(friendlyError(error));
        return;
      }
      setSuccess("Password berhasil diubah. Mengalihkan ke katalog...");
      setTimeout(() => router.replace("/beli"), 1500);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Atur Password Baru" subtitle="Masukkan password baru untuk akun Anda.">
      {!ready && !expired ? (
        <div className="mb-6 flex items-center gap-2 text-gray-600 dark:text-zinc-400">
          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Memeriksa tautan...</span>
        </div>
      ) : null}
      {expired && !ready ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru di halaman Lupa password.
        </p>
      ) : null}
      {ready ? (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Password Baru
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Konfirmasi Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg p-3 text-sm font-medium border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="alert" className="rounded-lg p-3 text-sm font-medium border border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
              {success}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-70 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
      ) : null}
      <div className="mt-8">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          <span className="mr-2">←</span> Kembali ke login
        </Link>
      </div>
    </AuthShell>
  );
}
