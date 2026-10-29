"use client";
import * as React from "react";

export function RevealCard({
  children,
  className = "",
  focusRef,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  focusRef?: React.Ref<HTMLDivElement>;
  delay?: number;
}) {
  const element = React.useRef<HTMLDivElement>(null);
  const [waiting, setWaiting] = React.useState(false);
  React.useEffect(() => {
    const target = element.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!target || media.matches || !("IntersectionObserver" in window)) return;
    if (target.getBoundingClientRect().top < window.innerHeight * 0.95) return;
    setWaiting(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setWaiting(false);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(target);
    const show = () => {
      if (media.matches) {
        setWaiting(false);
        observer.disconnect();
      }
    };
    media.addEventListener("change", show);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", show);
    };
  }, []);
  return (
    <div
      ref={(node) => {
        element.current = node;
        if (typeof focusRef === "function") focusRef(node);
        else if (focusRef) focusRef.current = node;
      }}
      style={{ "--reveal-delay": `${Math.min(180, Math.max(0, delay))}ms` } as React.CSSProperties}
      tabIndex={-1}
      className={`viewport-reveal ${waiting ? "reveal-waiting" : "reveal-visible"} ${className}`}
      onFocusCapture={() => setWaiting(false)}
    >
      {children}
    </div>
  );
}
