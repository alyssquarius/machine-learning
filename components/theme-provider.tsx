"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

function ThemeTransition() {
  React.useEffect(() => {
    const root = document.documentElement;
    let dark = root.classList.contains("dark");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      const next = root.classList.contains("dark");
      if (next === dark) return;
      dark = next;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      root.setAttribute("data-theme-transition", "");
      clearTimeout(timer);
      timer = setTimeout(() => root.removeAttribute("data-theme-transition"), 500);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      root.removeAttribute("data-theme-transition");
    };
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeTransition />
      {children}
    </NextThemesProvider>
  );
}
