"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
}

const RoleContext = React.createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const store = useStore();
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>("guest");
  const [authChecked, setAuthChecked] = React.useState(false);

  async function fetchUserRole(userId: string, email?: string): Promise<Role> {
    if (email === "admin@autobuycars.com") {
      return "admin";
    }
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role && ["admin", "dealer", "buyer"].includes(profile.role)) {
        return profile.role as Role;
      }
    } catch {
      /* abaikan */
    }
    return "buyer";
  }

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const session = data?.session;
        if (session?.user) {
          setUser(session.user);
          store.setOwner(session.user.id);
          const r = await fetchUserRole(session.user.id, session.user.email);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole("guest");
        store.setOwner("");
        router.replace("/login");
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        store.setOwner(session.user.id);
        const r = await fetchUserRole(session.user.id, session.user.email);
        if (!cancelled) setRole(r);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await createClient().auth.signOut();
      store.setOwner("");
    } catch {
      /* abaikan */
    } finally {
      setUser(null);
      setRole("guest");
      router.replace("/login");
      router.refresh();
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

