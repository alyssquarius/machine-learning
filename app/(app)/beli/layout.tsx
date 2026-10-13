import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beli Mobil",
  description: "Cari dan beli mobil impianmu di AutoBuyCars.",
};

export default function BeliLayout({ children }: { children: React.ReactNode }) {
  return children;
}
