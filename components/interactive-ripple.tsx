"use client";

import * as React from "react";

/**
 * InteractiveRipple — Global tactile ripple effect for all clickable elements.
 * Generates an elegant water-ripple expanding from the exact pointer contact point.
 */
export function InteractiveRipple() {
  React.useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      // Hanya tangani primary click / tap (bukan right-click)
      if (e.button !== 0) return;

      const target = (e.target as HTMLElement | null)?.closest(
        'button, a, [role="button"], .car-card-hover, .kpi-card-hover, input[type="submit"], input[type="button"], .filter-pill'
      ) as HTMLElement | null;

      if (!target || target.hasAttribute("disabled") || target.getAttribute("aria-disabled") === "true") {
        return;
      }

      // Hindari ripple ganda jika diklik cepat
      const existing = target.querySelectorAll(".click-ripple-circle");
      if (existing.length > 2) {
        existing[0].remove();
      }

      const rect = target.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height) * 1.6;
      const radius = diameter / 2;

      // Koordinat relatif terhadap target
      const x = e.clientX - rect.left - radius;
      const y = e.clientY - rect.top - radius;

      // Tentukan kontras warna ripple (terang vs gelap)
      const computed = window.getComputedStyle(target);
      const bg = computed.backgroundColor || "";
      const isDark =
        target.classList.contains("bg-black") ||
        target.classList.contains("bg-zinc-950") ||
        target.classList.contains("bg-zinc-900") ||
        target.classList.contains("bg-zinc-800") ||
        bg.includes("rgb(0,") ||
        bg.includes("rgb(9,") ||
        bg.includes("rgb(24,") ||
        bg.includes("rgb(39,");

      const ripple = document.createElement("span");
      ripple.className = `click-ripple-circle ${isDark ? "ripple-light" : "ripple-dark"}`;
      ripple.style.width = `${diameter}px`;
      ripple.style.height = `${diameter}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Simpan overflow & position awal
      const origPos = computed.position;
      const needPos = origPos === "static";
      if (needPos) {
        target.style.position = "relative";
      }

      const origOverflow = target.style.overflow;
      target.style.overflow = "hidden";

      target.appendChild(ripple);

      // Bersihkan setelah animasi selesai
      const timer = setTimeout(() => {
        ripple.remove();
        if (needPos) {
          target.style.position = "";
        }
        target.style.overflow = origOverflow;
      }, 550);

      ripple.dataset.timer = String(timer);
    }

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return null;
}
