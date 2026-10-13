import { Suspense } from "react";
import VerifyEmailPage from "./verify-email-client";

export default function VerifyEmailWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black dark:border-zinc-800 dark:border-t-white" />
          <p className="mt-4 text-sm text-gray-600 dark:text-zinc-400">Memuat...</p>
        </div>
      </div>
    }>
      <VerifyEmailPage />
    </Suspense>
  );
}
