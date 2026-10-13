import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Profil, target penjualan, tampilan, dan data akun AutoBuyCars.",
};

export default function PengaturanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
