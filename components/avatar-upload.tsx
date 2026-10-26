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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_PX = 256; // output 256x256
const EDITOR_SIZE = 300; // ukuran editor canvas (px)

/* ------------------------------------------------------------------ */
/*  Image Editor Modal — crop, zoom, drag                             */
/* ------------------------------------------------------------------ */
interface EditorProps {
  file: File;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

function ImageEditor({ file, onConfirm, onCancel }: EditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragging = React.useRef(false);
  const lastPos = React.useRef({ x: 0, y: 0 });

  // Load image
  React.useEffect(() => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(image.src);
  }, [file]);

  // Hitung scale awal agar gambar mengisi editor
  React.useEffect(() => {
    if (!img) return;
    const fit = EDITOR_SIZE / Math.min(img.width, img.height);
    setScale(fit);
    // Posisi awal: tengah
    setOffset({
      x: (EDITOR_SIZE - img.width * fit) / 2,
      y: (EDITOR_SIZE - img.height * fit) / 2,
    });
  }, [img]);

  // Render canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !img) return;

    canvas.width = EDITOR_SIZE;
    canvas.height = EDITOR_SIZE;

    ctx.clearRect(0, 0, EDITOR_SIZE, EDITOR_SIZE);

    // Gambar background kotak-kotak (transparan)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, EDITOR_SIZE, EDITOR_SIZE);

    // Gambar foto
    ctx.drawImage(
      img,
      offset.x,
      offset.y,
      img.width * scale,
      img.height * scale
    );

    // Overlay gelap di luar lingkaran
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(EDITOR_SIZE / 2, EDITOR_SIZE / 2, EDITOR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Border lingkaran
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(EDITOR_SIZE / 2, EDITOR_SIZE / 2, EDITOR_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, scale, offset]);

  // Mouse / touch drag
  function startDrag(clientX: number, clientY: number) {
    dragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  }
  function moveDrag(clientX: number, clientY: number) {
    if (!dragging.current) return;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    lastPos.current = { x: clientX, y: clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }
  function endDrag() {
    dragging.current = false;
  }

  // Zoom slider
  function handleZoom(e: React.ChangeEvent<HTMLInputElement>) {
    if (!img) return;
    const newScale = parseFloat(e.target.value);
    // Zoom ke tengah canvas
    const cx = EDITOR_SIZE / 2;
    const cy = EDITOR_SIZE / 2;
    const ratio = newScale / scale;
    setOffset((prev) => ({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    }));
    setScale(newScale);
  }

  // Min/max zoom
  const minScale = img ? EDITOR_SIZE / Math.max(img.width, img.height) * 0.5 : 0.1;
  const fitScale = img ? EDITOR_SIZE / Math.min(img.width, img.height) : 1;
  const maxScale = fitScale * 4;

  // Konfirmasi: render final 256x256
  function handleConfirm() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_PX;
    canvas.height = AVATAR_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = AVATAR_PX / EDITOR_SIZE;
    ctx.drawImage(
      img,
      offset.x * ratio,
      offset.y * ratio,
      img.width * scale * ratio,
      img.height * scale * ratio
    );
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onConfirm(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <p className="text-sm font-semibold text-black dark:text-white">
          Atur Foto Profil
        </p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Geser foto untuk mengatur posisi, gunakan slider untuk zoom.
        </p>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={EDITOR_SIZE}
          height={EDITOR_SIZE}
          className="cursor-grab touch-none rounded-full active:cursor-grabbing"
          style={{ width: EDITOR_SIZE, height: EDITOR_SIZE }}
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => {
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
          }}
          onTouchEnd={endDrag}
        />

        {/* Zoom slider */}
        <div className="flex w-full items-center gap-3 px-2">
          <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.01}
            value={scale}
            onChange={handleZoom}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-black dark:bg-zinc-700 dark:accent-white"
          />
          <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6M11 8v6" />
          </svg>
        </div>

        {/* Tombol */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-black transition hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AvatarUpload — main component                                     */
/* ------------------------------------------------------------------ */
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
  const [editorFile, setEditorFile] = React.useState<File | null>(null);

  // Sync preview jika currentUrl berubah dari luar
  React.useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

    // Buka editor
    setEditorFile(file);

    // Reset input agar bisa pilih file yang sama
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleEditorConfirm(dataUrl: string) {
    setEditorFile(null);
    setUploading(true);
    try {
      // 1. Simpan ke LocalStorage segera untuk instan persistence tanpa flicker
      if (typeof window !== "undefined" && userId) {
        try {
          localStorage.setItem(`abc_avatar_${userId}`, dataUrl);
        } catch {
          /* abaikan quota */
        }
      }

      const supabase = createClient();

      // 2. Simpan ke auth user_metadata di Supabase Auth (selalu berhasil & timpa google avatar)
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: dataUrl },
        });
      } catch (authErr) {
        console.warn("auth.updateUser avatar error:", authErr);
      }

      // 3. Upsert ke tabel profiles di Supabase (gunakan upsert agar tidak hilang jika row belum ada)
      try {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              avatar_url: dataUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

        if (upsertErr) {
          console.warn("Upsert profile error:", upsertErr.message);
        }
      } catch (profErr) {
        console.warn("profile upsert error:", profErr);
      }

      setPreview(dataUrl);
      onUploaded(dataUrl);
      // Broadcast agar AppShell, Profil, dan Pengaturan langsung update
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: dataUrl }));
      toast("Foto profil berhasil diperbarui.");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast("Terjadi kesalahan saat memproses foto.");
    } finally {
      setUploading(false);
    }
  }

  function handleEditorCancel() {
    setEditorFile(null);
  }

  async function handleRemove() {
    if (!confirm("Hapus foto profil?")) return;
    setUploading(true);
    try {
      if (typeof window !== "undefined" && userId) {
        try {
          localStorage.removeItem(`abc_avatar_${userId}`);
          localStorage.setItem(`abc_avatar_cleared_${userId}`, "true");
        } catch {
          /* abaikan */
        }
      }

      const supabase = createClient();
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: "" },
        });
      } catch {
        /* abaikan */
      }

      try {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              avatar_url: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
      } catch {
        /* abaikan */
      }

      setPreview("");
      onUploaded("");
      // Broadcast agar AppShell dan komponen lain ikut update
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: "" }));
      toast("Foto profil dihapus.");
    } catch {
      toast("Gagal menghapus foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Editor modal */}
      {editorFile && (
        <ImageEditor
          file={editorFile}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

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
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  );
}
