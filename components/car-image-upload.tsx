"use client";

import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// Pilihan preset foto mobil berkualitas tinggi untuk kemudahan input
const PRESET_CAR_PHOTOS = [
  {
    name: "SUV Modern",
    url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Sedan Premium",
    url: "https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "MPV Keluarga",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Mobil Listrik",
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Sport Compact",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  },
];

interface CarImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

export function CarImageUpload({ value, onChange, error }: CarImageUploadProps) {
  const [mode, setMode] = React.useState<"file" | "url" | "preset">("file");
  const [urlInput, setUrlInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (value && !value.startsWith("data:")) {
      setUrlInput(value);
    }
  }, [value]);

  // Kompres gambar via HTML5 Canvas agar ringan dan tajam
  async function optimizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const maxWidth = 1280;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Render gambar tajam
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Output sebagai JPEG 84% quality (ringan & sangat tajam)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Gagal membaca file gambar."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  }

  // Upload ke Supabase Storage (dengan fallback data URL)
  async function handleFileProcess(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Ukuran gambar maksimal 15 MB.");
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      // 1. Optimasi gambar via Canvas
      const optimizedDataUrl = await optimizeImage(file);

      // 2. Coba upload ke Supabase Storage bucket 'avatars' / 'cars' jika login
      let uploadedUrl = optimizedDataUrl;
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const ext = file.name.split(".").pop() || "jpg";
          const fileName = `car_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const filePath = `${authData.user.id}/${fileName}`;

          // Convert dataURL ke blob untuk di-upload
          const res = await fetch(optimizedDataUrl);
          const blob = await res.blob();

          const { error: uploadErr } = await supabase.storage
            .from("avatars")
            .upload(filePath, blob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubUrl } = supabase.storage
              .from("avatars")
              .getPublicUrl(filePath);
            if (pubUrl?.publicUrl) {
              uploadedUrl = pubUrl.publicUrl;
            }
          }
        }
      } catch (err) {
        console.warn("Storage upload fallback to optimized data URL:", err);
      }

      onChange(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses gambar.";
      setUploadError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  }

  function handleApplyUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError("Masukkan URL foto yang valid.");
      return;
    }
    setUploadError(null);
    onChange(trimmed);
  }

  function handleRemove() {
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Label & Tab Pilihan Sumber Foto */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-xs font-semibold tracking-wide text-gray-700 dark:text-zinc-300">
          Foto Kendaraan <span className="text-gray-400 font-normal">(Disarankan)</span>
        </label>

        {/* Tab segmented control ala Apple */}
        <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
              mode === "file"
                ? "bg-white text-black shadow-xs dark:bg-zinc-700 dark:text-white"
                : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Unggah File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
              mode === "url"
                ? "bg-white text-black shadow-xs dark:bg-zinc-700 dark:text-white"
                : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Tautan URL
          </button>
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
              mode === "preset"
                ? "bg-white text-black shadow-xs dark:bg-zinc-700 dark:text-white"
                : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Galeri Contoh
          </button>
        </div>
      </div>

      {/* JIKA SUDAH ADA GAMBAR: PREVIEW APPLE-STYLE */}
      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-zinc-950 shadow-xs dark:border-zinc-800 group">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src={value}
              alt="Preview Mobil"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Ambient vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Badge status foto */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-black backdrop-blur-md shadow-xs dark:bg-black/80 dark:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Foto Utama
              </span>
            </div>

            {/* Floating Action Buttons ala iOS */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-black backdrop-blur-md transition-all hover:bg-white active:scale-95 shadow-sm dark:bg-zinc-900/90 dark:text-white dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Ganti
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-red-600 active:scale-95 shadow-sm"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* JIKA BELUM ADA GAMBAR: INPUT SESUAI MODE */
        <div>
          {mode === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                dragOver
                  ? "border-black bg-zinc-100/80 dark:border-white dark:bg-zinc-800/60"
                  : "border-gray-300 bg-gray-50/60 hover:border-gray-400 hover:bg-gray-100/50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {loading ? (
                <div className="flex flex-col items-center py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
                  <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Memproses & mengoptimalkan foto...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs transition-transform group-hover:scale-110 dark:bg-zinc-800">
                    <svg className="h-6 w-6 text-gray-700 dark:text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-black dark:text-white">
                    Pilih atau Seret Foto Mobil ke Sini
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                    Mendukung JPG, PNG, WEBP (foto otomatis dioptimalkan resolusi tingginya)
                  </p>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Jelajahi File
                  </button>
                </>
              )}
            </div>
          )}

          {mode === "url" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau tautan gambar langsung"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                Gunakan tautan gambar langsung dari web hosting atau cloud storage.
              </p>
            </div>
          )}

          {mode === "preset" && (
            <div>
              <p className="mb-2 text-[11px] text-gray-500 dark:text-zinc-400">
                Pilih salah satu foto demo realistis untuk listing Anda:
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESET_CAR_PHOTOS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => onChange(p.url)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1 text-left transition hover:border-black hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-white"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img
                        src={p.url}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="p-1.5 text-[11px] font-semibold text-gray-800 dark:text-zinc-200">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden input agar form FormData tetap menangkap field 'image' */}
      <input type="hidden" name="image" value={value} />

      {/* Error message jika ada */}
      {(uploadError || error) && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 animate-fade-in">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}
