import type { Metadata } from "next";
import { ChatNotifications } from "@/components/chat-notifications";
import { AppShell } from "@/components/app-shell";
import { ChatFloatingButton } from "@/components/whatsapp-contact";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan listing, penjualan, dan aktivitas AutoBuyCars.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatNotifications>
      <AppShell>{children}</AppShell>
      <ChatFloatingButton />
    </ChatNotifications>
  );
}
