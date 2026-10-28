"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

export function Dialog({
  children,
  onClose,
  title,
  label = "Informasi kendaraan",
  wide = false,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  label?: string;
  wide?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const ref = React.useRef<HTMLElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = ref.current;
    const backdrop = panel?.parentElement;
    const background = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop,
      )
      .map((element) => ({ element, inert: element.inert }));
    background.forEach(({ element }) => {
      element.inert = true;
    });
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length);
    (focusables()[0] || panel)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const items = focusables();
        if (!items.length) {
          event.preventDefault();
          panel?.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === items[0] || document.activeElement === panel)
        ) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0].focus();
        }
      }
    };
    panel?.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      panel?.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title || label}
        tabIndex={-1}
        className={`dialog-panel ${wide ? "dialog-wide" : ""} ${className}`}
      >
        {title ? (
          <header className="dialog-heading">
            <h2>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela"
              className="icon-button"
            >
              <Icon name="x" />
            </button>
          </header>
        ) : null}
        {children}
      </section>
    </div>,
    document.body,
  );
}
