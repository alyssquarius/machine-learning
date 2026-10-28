"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

const LEVELS = [
  { text: "", color: "bg-gray-200 dark:bg-zinc-800" },
  { text: "Lemah", color: "bg-red-500" },
  { text: "Cukup", color: "bg-orange-400" },
  { text: "Baik", color: "bg-yellow-400" },
  { text: "Kuat", color: "bg-green-500" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [emailSent, setEmailSent] = React.useState("");
  const [password, setPassword] = React.useState("");
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          if (cancelled) return;
          const role = profile?.role;
          if (["admin"].includes(role)) {
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

  const score = React.useMemo(() => {
    const v = password;
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    return Math.max(s, 1);
  }, [password]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("full_name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const pw = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (!fullName || !email || !pw) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (pw.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (pw !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setError("");
    setEmailSent("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(friendlyError(error));
        return;
      }
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("Email sudah terdaftar. Silakan login.");
        return;
      }

      // Jika session langsung ada (email confirmation disabled)
      if (data.session && data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            role: "buyer",
            display_name: fullName,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id", ignoreDuplicates: true });
        } catch {
          /* abaikan */
        }
        router.replace("/beli");
        return;
      }

      // Arahkan ke halaman input kode verifikasi OTP
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // Tampilan setelah email verifikasi terkirim
  if (emailSent) {
    return (
      <AuthShell title="Cek Email Anda" subtitle="Verifikasi diperlukan untuk mengaktifkan akun">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
            <svg className="h-8 w-8 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="mb-2 text-sm text-gray-700 dark:text-zinc-300">
            Kami mengirim link verifikasi ke:
          </p>
          <p className="mb-6 text-sm font-bold text-black dark:text-white">{emailSent}</p>
          <p className="mb-8 text-sm text-gray-500 dark:text-zinc-400">
            Buka email tersebut dan klik link verifikasi untuk mengaktifkan akun Anda.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-black py-3 text-center font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Kembali ke Login
            </Link>
            <button
              onClick={() => setEmailSent("")}
              className="w-full text-sm text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Daftar dengan email lain
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Buat Akun Pembeli Baru"
      subtitle="Daftar akun secara instan untuk mulai mencari, menawar, dan membeli mobil impian Anda."
      badge="Pendaftaran Akun Pembeli"
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
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Nama Lengkap
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Auto Enthusiast"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-12 text-base text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none dark:hover:text-zinc-200"
            >
              <EyeIcon />
            </button>
          </div>
          <div className="mt-2">
            <div className="flex h-1 w-full gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < score ? LEVELS[score].color : "bg-gray-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">
              {LEVELS[score].text}
            </p>
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
            placeholder="Ulangi password Anda"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-70 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus:ring-white"
          >
            {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-black hover:underline dark:text-white">
            Login di sini
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
