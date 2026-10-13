"use client";

import * as React from "react";

interface ToastCtx {
  toast: (msg: string) => void;
}

const Ctx = React.createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return React.useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = React.useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-4 pr-5 text-left text-sm font-medium text-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <svg
            className="h-4 w-4 shrink-0 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{msg}</span>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
