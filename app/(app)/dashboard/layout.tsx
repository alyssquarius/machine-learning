import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan listing, penjualan, dan aktivitas AutoBuyCars.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
