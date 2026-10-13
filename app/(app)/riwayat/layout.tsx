import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat",
  description: "Aktivitas jual beli yang tercatat di AutoBuyCars.",
};

export default function RiwayatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
