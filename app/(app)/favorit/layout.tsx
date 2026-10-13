import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorit",
  description: "Mobil yang kamu simpan di AutoBuyCars.",
};

export default function FavoritLayout({ children }: { children: React.ReactNode }) {
  return children;
}
