import { Suspense } from "react";
import BeliClient from "./beli-client";

export default function BeliPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-gray-500">Memuat...</p>}>
      <BeliClient />
    </Suspense>
  );
}
