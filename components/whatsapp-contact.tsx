"use client";

import * as React from "react";
import { WhatsAppIcon } from "./icons";
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
  return null;
}
