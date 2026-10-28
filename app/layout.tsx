import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";
import { ToastProvider } from "@/components/toast";
import { RoleProvider } from "@/components/role-provider";
import { InteractiveRipple } from "@/components/interactive-ripple";

export const metadata: Metadata = {
  title: {
    default: "AutoBuyCars",
    template: "%s | AutoBuyCars",
  },
  description: "Platform jual beli mobil terpercaya",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="font-sans bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased"
      >
        <ThemeProvider>
          <StoreProvider>
            <RoleProvider>
              <ToastProvider>{children}</ToastProvider>
              <InteractiveRipple />
            </RoleProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
