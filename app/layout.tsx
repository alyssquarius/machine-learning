import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./catalogue.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";
import { ToastProvider } from "@/components/toast";
import { RoleProvider } from "@/components/role-provider";
import { ConfirmActionProvider } from "@/components/confirm-action";

export const metadata: Metadata = {
  title: {
    default: "AutoBuyCars",
    template: "%s | AutoBuyCars",
  },
  description:
    "Cari mobil, simpan favorit, dan rencanakan anggaran dengan simulasi cicilan AutoBuyCars.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased">
        <ThemeProvider>
          <StoreProvider>
            <RoleProvider>
              <ToastProvider>
                <ConfirmActionProvider>{children}</ConfirmActionProvider>
              </ToastProvider>
            </RoleProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
