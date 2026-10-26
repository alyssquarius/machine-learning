"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChooseRolePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/beli");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-zinc-700 dark:border-t-white" />
    </div>
  );
}
