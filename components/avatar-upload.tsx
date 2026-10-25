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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
      toast("Format file harus JPG, PNG, atau WebP.");
      return;
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      toast("Ukuran file maksimal 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/avatar.${ext}`;

      // Upload ke Supabase Storage bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.warn("Upload error:", uploadError.message);
        toast("Gagal upload foto. Coba lagi.");
        return;
      }

      // Dapatkan public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Tambah cache buster agar browser muat ulang
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      // Simpan ke profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.warn("Update profile error:", updateError.message);
        toast("Foto terupload tapi gagal simpan ke profil.");
        return;
      }

      setPreview(publicUrl);
      onUploaded(publicUrl);
      toast("Foto profil berhasil diperbarui.");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast("Terjadi kesalahan saat upload foto.");
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

      // Hapus file dari storage (coba semua ekstensi umum)
      const exts = ["jpg", "jpeg", "png", "webp"];
      const paths = exts.map((ext) => `${userId}/avatar.${ext}`);
      await supabase.storage.from("avatars").remove(paths);

      // Hapus dari profiles
      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

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
          JPG, PNG, atau WebP. Maks 2 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
