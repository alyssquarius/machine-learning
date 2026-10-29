"use client";

import * as React from "react";
import { Dialog } from "./dialog";
import { useToast } from "./toast";

type Confirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  success: string;
  action: () => void | Promise<void>;
};
const Context = React.createContext<((request: Confirmation) => void) | null>(null);

export function ConfirmActionProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<Confirmation | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const running = React.useRef(false);
  const { toast } = useToast();
  const open = React.useCallback((next: Confirmation) => {
    setError("");
    setRequest(next);
  }, []);
  function cancel() {
    if (!running.current) setRequest(null);
  }
  async function execute() {
    if (!request || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await request.action();
      setRequest(null);
      toast(request.success);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Data belum berhasil dihapus. Silakan coba lagi.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={open}>
      {children}
      {request ? (
        <Dialog onClose={cancel} label={request.title}>
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">{request.title}</h2>
            <p className="page-description mt-3">{request.description}</p>
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
              >
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3" aria-busy={busy}>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="button-secondary disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={execute}
                disabled={busy}
                className="rounded-full bg-red-700 px-5 py-3 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                {busy ? "Menghapus…" : request.confirmLabel}
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </Context.Provider>
  );
}

export function useConfirmAction() {
  const value = React.useContext(Context);
  if (!value) throw new Error("ConfirmActionProvider diperlukan.");
  return value;
}
