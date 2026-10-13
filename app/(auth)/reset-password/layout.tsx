import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Sandi",
  description: "Buat kata sandi baru untuk akun AutoBuyCars kamu.",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
