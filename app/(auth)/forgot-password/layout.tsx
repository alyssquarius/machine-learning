import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Sandi",
  description: "Reset kata sandi akun AutoBuyCars kamu.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
