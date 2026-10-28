"use client";

import * as React from "react";
import { Icon } from "@/components/icons";

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
    timer.current = setTimeout(() => setMsg(null), 4000);
  }, []);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[120] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-emerald-100 bg-white py-3 pl-4 pr-3 text-left text-xs font-medium text-emerald-950 shadow-xl dark:border-emerald-900 dark:bg-zinc-900 dark:text-emerald-100"
        >
          <Icon name="bell" className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
          <button type="button" className="icon-button !h-6 !w-6" aria-label="Tutup pemberitahuan" onClick={() => setMsg(null)}><Icon name="x" className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
