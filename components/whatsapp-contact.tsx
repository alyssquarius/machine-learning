"use client";

import * as React from "react";
import { WhatsAppIcon } from "./icons";

interface WhatsAppContactProps {
  phoneNumber: string;
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
    // Format nomor telepon (hapus karakter non-digit dan ubah awalan 0 menjadi 62)
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    if (!cleanPhone.startsWith("62") && cleanPhone.length > 0) {
      cleanPhone = "62" + cleanPhone;
    }
    
    // Encode pesan untuk URL
    const encodedMessage = encodeURIComponent(message);
    
    // Buat URL WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Buka di tab baru
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20BA5A] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {children || "Hubungi via WhatsApp"}
    </button>
  );
}

interface WhatsAppFloatingButtonProps {
  phoneNumber: string;
  message?: string;
}

export function WhatsAppFloatingButton({
  phoneNumber,
  message = "Halo, saya tertarik dengan AutoBuyCars",
}: WhatsAppFloatingButtonProps) {
  const handleClick = () => {
    let cleanPhone = phoneNumber.replace(/\D/g, "");
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
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:bg-[#20BA5A] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
      aria-label="Hubungi via WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </button>
  );
}
