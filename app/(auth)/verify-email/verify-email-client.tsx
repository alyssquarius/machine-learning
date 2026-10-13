"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    // Focus input pertama saat mount
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // Hanya terima angka
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus ke input berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Pindah ke input sebelumnya saat backspace
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Ambil 6 digit pertama
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");
    
    const newCode = [...code];
    digits.forEach((digit, idx) => {
      if (idx < 6) newCode[idx] = digit;
    });
    
    setCode(newCode);
    
    // Focus ke input terakhir yang diisi
    const lastFilledIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  }

  async function handleVerify() {
    const otp = code.join("");
    
    if (otp.length !== 6) {
      setError("Kode verifikasi harus 6 digit");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      
      if (verifyError) {
        setError("Kode verifikasi salah atau sudah kadaluarsa");
        setLoading(false);
        return;
      }
      
      if (data.session) {
        setSuccess(true);
        // Redirect ke choose-role untuk memilih peran
        setTimeout(() => {
          router.replace("/choose-role");
        }, 1500);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Email tidak ditemukan");
      return;
    }
    
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    
    try {
      const supabase = createClient();
      
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      
      if (resendError) {
        setError("Gagal mengirim ulang kode. Silakan coba lagi.");
        setResendLoading(false);
        return;
      }
      
      setResendSuccess(true);
      setResendLoading(false);
      
      // Reset success message setelah 3 detik
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setResendLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Verifikasi Berhasil!" subtitle="Akun Anda telah diaktifkan">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg text-gray-700 dark:text-zinc-300">
            Mengalihkan ke pemilihan peran...
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verifikasi Email"
      subtitle={email ? `Kode verifikasi telah dikirim ke ${email}` : "Masukkan kode verifikasi dari email Anda"}
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}
      
      {resendSuccess && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
          Kode verifikasi baru telah dikirim!
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 flex justify-center gap-3" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-12 rounded-lg border-2 border-gray-300 bg-white text-center text-2xl font-bold text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
          ))}
        </div>
        
        <p className="text-center text-sm text-gray-500 dark:text-zinc-400">
          Masukkan 6 digit kode verifikasi
        </p>
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || code.join("").length !== 6}
        className="w-full rounded-lg bg-black py-3 font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus:ring-white"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-zinc-950 dark:border-t-transparent" />
            Memverifikasi...
          </span>
        ) : (
          "Verifikasi"
        )}
      </button>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Tidak menerima kode?{" "}
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="font-semibold text-black hover:underline disabled:opacity-50 dark:text-white"
          >
            {resendLoading ? "Mengirim..." : "Kirim ulang"}
          </button>
        </p>
        
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Kembali ke login
        </Link>
      </div>
    </AuthShell>
  );
}
