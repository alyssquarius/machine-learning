"use client";

import Link from "next/link";
import * as React from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) {
      setError("Email wajib diisi.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/reset-password", window.location.href).href,
      });
      if (error) {
        setError(friendlyError(error));
        return;
      }
      setSuccess(
        "Jika email terdaftar, tautan untuk mengatur ulang password sudah dikirim. Cek kotak masuk atau folder spam.",
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Lupa Password?" subtitle="Masukkan email dan kami kirimkan tautan reset.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          />
        </div>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        ) : null}
        {success ? (
          <div
            role="alert"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400"
          >
            {success}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-70 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus:ring-white"
        >
          {loading ? "Mengirim..." : "Kirim Tautan Reset"}
        </button>
      </form>
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          <span className="mr-2">←</span>
          Kembali ke login
        </Link>
      </div>
    </AuthShell>
  );
}
