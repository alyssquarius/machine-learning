import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jual Mobil",
  description: "Pasang listing baru dan kelola status penjualanmu di AutoBuyCars.",
};

export default function JualLayout({ children }: { children: React.ReactNode }) {
  return children;
}
