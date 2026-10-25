"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  fallbackInitial: string;
  onUploaded: (url: string) => void;
  size?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB input (akan di-compress)
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_PX = 256; // resize ke 256x256

/**
 * Resize & compress gambar di client menggunakan Canvas API.
 * Output: data:image/jpeg;base64,... (biasanya ~10-30 KB)
 */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Crop ke persegi dari tengah
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_PX;
      canvas.height = AVATAR_PX;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, sx, sy, min, min, 0, 0, AVATAR_PX, AVATAR_PX);
      // Compress sebagai JPEG quality 0.8
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("Gagal membaca gambar"));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUpload({
  userId,
  currentUrl,
  fallbackInitial,
  onUploaded,
  size = 80,
}: AvatarUploadProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(currentUrl);

  // Sync preview jika currentUrl berubah dari luar
  React.useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast("Format file harus JPG, PNG, WebP, atau GIF.");
      return;
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      toast("Ukuran file maksimal 5 MB.");
      return;
    }

    setUploading(true);
    try {
      // Resize & compress di client
      const dataUrl = await resizeImage(file);

      // Simpan data URL ke tabel profiles
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: dataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.warn("Update profile error:", updateError.message);
        toast("Gagal menyimpan foto profil. Coba lagi.");
        return;
      }

      setPreview(dataUrl);
      onUploaded(dataUrl);
      toast("Foto profil berhasil diperbarui.");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast("Terjadi kesalahan saat memproses foto.");
    } finally {
      setUploading(false);
      // Reset input agar bisa pilih file yang sama
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm("Hapus foto profil?")) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        toast("Gagal menghapus foto.");
        return;
      }

      setPreview("");
      onUploaded("");
      toast("Foto profil dihapus.");
    } catch {
      toast("Gagal menghapus foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-full bg-black dark:bg-white"
          style={{ width: size, height: size }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Foto profil"
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="font-bold text-white dark:text-zinc-950"
              style={{ fontSize: size * 0.35 }}
            >
              {fallbackInitial}
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
        </div>
        {/* Overlay kamera saat hover */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 disabled:cursor-wait"
          title="Ganti foto profil"
        >
          <svg
            className="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100 disabled:opacity-60 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
        >
          {uploading ? "Mengupload..." : "Ganti Foto"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Hapus Foto
          </button>
        )}
        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
          JPG, PNG, WebP, atau GIF. Maks 5 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
