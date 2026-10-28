"use client";
import * as React from "react";
import { useRole } from "./role-provider";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./toast";
export type InboxThread = {
  id: string;
  buyer_id: string;
  buyer_name: string;
  created_at: string;
  last_message_id: string | null;
  last_body: string | null;
  last_sender_id: string | null;
  last_message_at: string | null;
  unread_count: number;
};
const Ctx = React.createContext({
  threads: [] as InboxThread[],
  unread: 0,
  error: "",
  loading: true,
  refresh: () => {},
  markRead: (_id: string) => Promise.resolve(),
});
export const useChatNotifications = () => React.useContext(Ctx);
export function ChatNotifications({ children }: { children: React.ReactNode }) {
  const { user, role, authChecked } = useRole();
  const { toast } = useToast();
  const [threads, setThreads] = React.useState<InboxThread[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [revision, setRevision] = React.useState(0);
  const refresh = React.useCallback(() => setRevision((n) => n + 1), []);
  React.useEffect(() => {
    setThreads([]);
    setError("");
    setLoading(!!user);
    if (!authChecked || !user) return;
    let stopped = false,
      busy = false;
    let previous: Map<string, string | null> | null = null;
    const client = createClient();
    async function load() {
      if (stopped || busy || document.hidden) return;
      busy = true;
      try {
        const { data, error: failure } = await client.rpc("support_inbox");
        if (stopped) return;
        setLoading(false);
        if (failure) {
          setError("Kotak masuk belum dapat dimuat. Coba lagi.");
          return;
        }
        const rows = (data || []) as InboxThread[];
        if (
          previous &&
          rows.some(
            (t) =>
              t.last_message_id &&
              previous!.get(t.id) !== t.last_message_id &&
              t.last_sender_id !== user!.id &&
              Number(t.unread_count) > 0,
          )
        )
          toast(
            role === "admin"
              ? "Pesan baru dari pembeli. Buka Chat untuk membalas."
              : "Ada balasan baru dari admin.",
          );
        previous = new Map(rows.map((t) => [t.id, t.last_message_id]));
        setThreads(rows);
        setError("");
      } catch {
        if (!stopped) {
          setLoading(false);
          setError("Koneksi chat terputus. Silakan coba lagi.");
        }
      } finally {
        busy = false;
      }
    }
    void load();
    const timer = setInterval(load, 5000);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", load);
    window.addEventListener("support-chat-refresh", load);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", load);
      window.removeEventListener("support-chat-refresh", load);
    };
  }, [user?.id, role, authChecked, revision, toast]);
  async function markRead(id: string) {
    const { error } = await createClient().rpc("mark_support_read", { p_message_id: id });
    if (!error) window.dispatchEvent(new Event("support-chat-refresh"));
  }
  return (
    <Ctx.Provider
      value={{
        threads,
        unread: threads.reduce((n, t) => n + Number(t.unread_count), 0),
        error,
        loading,
        refresh,
        markRead,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
