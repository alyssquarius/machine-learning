"use client";

import * as React from "react";
import Link from "next/link";
import { WhatsAppIcon } from "./icons";
import { useRole } from "@/components/role-provider";
import { getAdminWhatsApp } from "@/lib/config";

interface WhatsAppContactProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppContact({
  phoneNumber,
  message = "Halo, saya tertarik dengan AutoBuyCars",
  className = "",
  children,
}: WhatsAppContactProps) {
  const handleClick = () => {
    const rawPhone = phoneNumber || getAdminWhatsApp();
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) {
      cleanPhone = "62" + cleanPhone;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20BA5A] active:scale-97 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {children || "Hubungi via WhatsApp"}
    </button>
  );
}

export function ChatFloatingButton() {
  const { role, authChecked } = useRole();
  if (!authChecked || role === "admin") return null;
  return <Link href={role === "guest" ? "/login" : "/chat"} aria-label="Chat dengan admin" title="Chat Admin" className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition hover:bg-sky-700"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 2 2-6a8.5 8.5 0 1 1 18-4.5Z"/><path d="M7 10h10M7 14h6"/></svg></Link>;
}
