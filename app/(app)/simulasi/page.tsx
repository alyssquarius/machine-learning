import type { Metadata } from "next";
import { CreditSimulator } from "@/components/credit-simulator";
export const metadata: Metadata = {
  title: "Simulasi Kredit",
  description: "Rencanakan anggaran mobil dengan simulasi uang muka, tenor, dan cicilan.",
};
export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ harga?: string | string[] }>;
}) {
  const params = await searchParams;
  const value = typeof params.harga === "string" ? Number(params.harga) : 0;
  const initialPrice =
    Number.isFinite(value) && value >= 1000000 && value <= 10000000000 ? value : 250000000;
  return <CreditSimulator key={initialPrice} initialPrice={initialPrice} />;
}
