"use client";
import * as React from "react";
import { carPhotos } from "@/lib/car-photos";

export function CarGallery({
  car,
}: {
  car: { id: string; title: string; image: string; images?: string[] };
}) {
  const photos = carPhotos(car);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => setActive(0), [car.id]);
  const index = Math.min(active, Math.max(0, photos.length - 1));
  return (
    <section aria-label="Galeri foto kendaraan" className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <img
          width={960}
          height={600}
          src={photos[index] || "/images/car-hero.jpg"}
          alt={`${car.title}, foto ${index + 1}`}
          className="aspect-[16/10] w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/car-hero.jpg";
          }}
        />
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto sebelumnya"
              className="gallery-arrow left-3"
              onClick={() => setActive((index + photos.length - 1) % photos.length)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Foto berikutnya"
              className="gallery-arrow right-3"
              onClick={() => setActive((index + 1) % photos.length)}
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-lg bg-slate-950/70 px-3 py-1 text-xs text-white">
              {index + 1} / {photos.length}
            </span>
          </>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Lihat foto ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setActive(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-sky-500" : "border-transparent"}`}
            >
              <img
                src={src}
                alt=""
                width={160}
                height={100}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
