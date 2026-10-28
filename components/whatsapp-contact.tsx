"use client";

import * as React from "react";
import { WhatsAppIcon } from "./icons";
import { getAdminWhatsApp } from "@/lib/config";
import { useToast } from "./toast";

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
  const { toast } = useToast();
  const handleClick = () => {
    const rawPhone = phoneNumber || getAdminWhatsApp();
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) {
      cleanPhone = "62" + cleanPhone;
    }

    if (!/^62\d{8,13}$/.test(cleanPhone)) {
      toast("Nomor WhatsApp belum tersedia. Gunakan Chat Admin untuk menanyakan mobil ini.");
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg bg-[#137a3b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#106532] active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#137a3b] ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {children || "Hubungi via WhatsApp"}
    </button>
  );
}

export function ChatFloatingButton() {
  return null;
}
