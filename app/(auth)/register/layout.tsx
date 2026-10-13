import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun baru untuk mulai jual beli mobil di AutoBuyCars.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
