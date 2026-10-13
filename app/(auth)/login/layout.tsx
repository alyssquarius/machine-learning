import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk untuk melanjutkan ke AutoBuyCars.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
