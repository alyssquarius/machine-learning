"use client";
import Link from "next/link";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icons";
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: "search", title: "Temukan pilihanmu", text: "Ketik nama mobil atau pilih anggaran. Ketuk foto untuk membaca detail; ikon hati menyimpan mobil favorit.", href: "/beli", label: "Jelajahi katalog" },
    { icon: "calculator", title: "Rencanakan anggaran", text: "Sesuaikan uang muka dan tenor untuk memperkirakan cicilan.", href: "/simulasi", label: "Buka simulasi kredit" },
    { icon: "chat", title: "Tanyakan ke admin", text: "Bingung memilih? Sampaikan kebutuhan dan anggaranmu melalui chat. Pada listing asli, Hubungi Penjual membuka WhatsApp penjual.", href: "/chat", label: "Chat dengan admin" },
  ];
  return <Dialog title="Ada yang bisa kami bantu?" onClose={onClose} wide><div className="p-6 sm:p-8"><p className="page-description mb-6">Mulai dari mencari mobil. Gunakan fitur lain hanya saat dibutuhkan.</p><div className="space-y-3">{steps.map(step => <Link key={step.href} href={step.href} onClick={onClose} className="help-item"><span className="soft-icon"><Icon name={step.icon} /></span><div><h3>{step.title}</h3><p>{step.text}</p><span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{step.label} →</span></div></Link>)}</div><details className="mt-6 rounded-xl border border-gray-200 p-4 text-sm dark:border-zinc-700"><summary className="cursor-pointer font-semibold">Mengapa katalog berbeda di perangkat lain?</summary><p className="page-description mt-3">Listing, favorit, dan riwayat saat ini disimpan pada browser yang digunakan. Hindari menghapus data situs sebelum menyimpan salinan informasi penting. Checkout dan invoice merupakan simulasi; pembayaran tidak diproses melalui website.</p></details></div></Dialog>;
}
