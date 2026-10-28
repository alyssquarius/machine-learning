"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  type Role,
  type Permission,
  getPermissions,
  hasPermission as checkPermission,
} from "@/lib/roles";
import { useStore } from "@/components/store-provider";

export interface RoleContextType {
  user: User | null;
  role: Role;
  permissions: Permission;
  authChecked: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof Permission) => boolean;
  refreshRole: () => Promise<void>;
  switchRole: (newRole: Role) => Promise<boolean>;
}

const RoleContext = React.createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const store = useStore();
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>("guest");
  const [authChecked, setAuthChecked] = React.useState(false);

  async function fetchUserRole(userId: string): Promise<Role> {
    try {
      const { data: profile } = await createClient()
        .from("profiles").select("role").eq("id", userId).single();
      if (profile?.role && ["admin", "dealer", "buyer"].includes(profile.role)) {
        return profile.role as Role;
      }
    } catch {
      // Unavailable role data must not grant elevated permissions.
    }
    return "buyer";
  }

  React.useEffect(() => {
    let cancelled = false;
    if (!getSupabaseConfig()) {
      setAuthChecked(true);
      return;
    }
    const supabase = createClient();

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        const session = data.user ? { user: data.user } : null;
        if (session?.user) {
          setUser(session.user);
          store.setOwner(session.user.id);
          const r = await fetchUserRole(session.user.id);
          if (!cancelled) setRole(r);
        } else {
          setUser(null);
          setRole("guest");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setRole("guest");
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole("guest");
        store.setOwner("");
        router.replace("/login");
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        store.setOwner(session.user.id);
        // Supabase callbacks run under the auth lock; query after it is released.
        setTimeout(() => {
          if (cancelled) return;
          void fetchUserRole(session.user.id).then((r) => {
            if (!cancelled) setRole(r);
          });
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    const userId = user?.id;
    try {
      await createClient().auth.signOut();
      store.setOwner("");
      // Bersihkan cached role
      if (userId) {
        try {
          localStorage.removeItem(`abc_role_${userId}`);
        } catch {
          /* abaikan */
        }
      }
    } catch {
      /* abaikan */
    } finally {
      setUser(null);
      setRole("guest");
      // Selalu navigasi penuh kembali ke /login
      window.location.href = "/login";
    }
  }

  async function switchRole(newRole: Role): Promise<boolean> {
    if (!user || role === "admin" || !["buyer", "dealer"].includes(newRole)) return false;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          role: newRole,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.warn("Switch role error:", error.message);
        return false;
      }
      try {
        localStorage.setItem(`abc_role_${user.id}`, newRole);
      } catch {
        /* abaikan */
      }
      setRole(newRole);
      window.dispatchEvent(new CustomEvent("role-updated", { detail: newRole }));
      return true;
    } catch (err) {
      console.error("switchRole failed:", err);
      return false;
    }
  }

  async function refreshRole() {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (u) {
        setUser(u);
        const r = await fetchUserRole(u.id);
        setRole(r);
      }
    } catch {
      /* abaikan */
    }
  }

  const permissions = React.useMemo(() => getPermissions(role), [role]);

  const value = React.useMemo<RoleContextType>(
    () => ({
      user,
      role,
      permissions,
      authChecked,
      logout,
      hasPermission: (perm) => checkPermission(role, perm),
      refreshRole,
      switchRole,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, role, permissions, authChecked],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextType {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole harus digunakan di dalam <RoleProvider>");
  }
  return ctx;
}

