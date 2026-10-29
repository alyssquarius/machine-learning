"use client";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { carPhotos, MAX_CAR_PHOTOS } from "@/lib/car-photos";
import { useConfirmAction } from "@/components/confirm-action";

export function CarImageUpload({
  value,
  onChange,
  onBusyChange,
}: {
  value: string[];
  onChange: (photos: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [url, setUrl] = React.useState("");
  const confirmAction = useConfirmAction();
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const latest = React.useRef(value);
  latest.current = value;
  const busyRef = React.useRef(false);

  async function processFiles(files: File[]) {
    if (busyRef.current) return;
    if (files.length + latest.current.length > MAX_CAR_PHOTOS) {
      setError("Maksimal 10 foto per mobil. Hapus foto yang tidak diperlukan terlebih dahulu.");
      return;
    }
    if (
      files.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 15 * 1024 * 1024,
      )
    ) {
      setError("Gunakan JPG, PNG atau WebP, maksimal 15 MB per file.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    const added: string[] = [];
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Masuk kembali sebelum mengunggah foto.");
      for (const file of files) {
        const bitmap = await createImageBitmap(file);
        try {
          const ratio = Math.min(1, 1280 / bitmap.width, 960 / bitmap.height);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(bitmap.width * ratio);
          canvas.height = Math.round(bitmap.height * ratio);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Browser tidak dapat memproses foto.");
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Foto gagal diproses."))),
              "image/jpeg",
              0.78,
            ),
          );
          const path = `${data.user.id}/car_${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, blob, { contentType: "image/jpeg", upsert: false });
          if (uploadError)
            throw new Error("Unggah foto gagal. Coba lagi atau gunakan tautan foto.");
          added.push(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
        } finally {
          bitmap.close();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Foto gagal diunggah.");
    } finally {
      if (added.length) onChange(carPhotos({ images: [...latest.current, ...added] }));
      busyRef.current = false;
      setBusy(false);
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  }
  function addUrl() {
    if (busy || value.length >= MAX_CAR_PHOTOS) return;
    try {
      if (new URL(url).protocol !== "https:") throw new Error();
    } catch {
      setError("Masukkan tautan foto HTTPS yang valid.");
      return;
    }
    const next = carPhotos({ images: [...value, url.trim()] });
    if (next.length === value.length) {
      setError("Foto sudah ada atau tautan terlalu panjang.");
      return;
    }
    onChange(next);
    setUrl("");
    setError("");
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Foto pertama menjadi sampul.</p>
        <span className="text-xs font-semibold">{value.length}/10 foto</span>
      </div>
      {value.length ? (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, i) => (
            <li
              key={src}
              className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <img
                src={src}
                alt={`Foto mobil ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-wrap items-center justify-between gap-1 p-2">
                <button
                  type="button"
                  disabled={busy || i === 0}
                  onClick={() => onChange([src, ...value.filter((_, j) => j !== i)])}
                  className="text-[10px] font-semibold text-sky-700 disabled:text-slate-500 dark:text-sky-300"
                >
                  {i === 0 ? "Sampul" : "Jadikan sampul"}
                </button>
                <button
                  type="button"
                  aria-label={`Hapus foto ${i + 1}`}
                  disabled={busy}
                  onClick={() =>
                    confirmAction({
                      title: "Hapus foto mobil?",
                      description: `Foto ${i + 1} akan dihapus dari formulir. Perubahan diterapkan ke listing setelah kamu menyimpannya.`,
                      confirmLabel: "Hapus foto",
                      success:
                        "Foto dihapus dari formulir. Simpan listing untuk menerapkan perubahan.",
                      action: () => {
                        onChange(latest.current.filter((photo) => photo !== src));
                      },
                    })
                  }
                  className="text-[10px] text-red-600"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <input
        ref={input}
        aria-label="Pilih foto mobil"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy || value.length >= 10}
        className="sr-only"
        onChange={(e) => processFiles(Array.from(e.target.files || []))}
      />
      <button
        type="button"
        disabled={busy || value.length >= 10}
        className="button-secondary w-full disabled:opacity-40"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          processFiles(Array.from(e.dataTransfer.files));
        }}
      >
        {busy ? "Mengunggah foto…" : "Pilih atau seret foto (maks. 10)"}
      </button>
      <div className="flex gap-2">
        <input
          aria-label="Tautan foto mobil"
          type="url"
          value={url}
          disabled={busy || value.length >= 10}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="min-w-0 flex-1 border px-3 py-2 text-xs"
        />
        <button
          type="button"
          className="button-secondary"
          disabled={busy || value.length >= 10}
          onClick={addUrl}
        >
          Tambah URL
        </button>
      </div>
      <p className="text-[10px] text-slate-500">
        JPG, PNG, WebP · maks. 15 MB per file. Foto dioptimalkan sebelum diunggah.
      </p>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
