import type { SupabaseClient, User } from "@supabase/supabase-js";

function hasInlineAvatar(metadata: Record<string, unknown> | undefined): boolean {
  return typeof metadata?.avatar_url === "string" && metadata.avatar_url.startsWith("data:");
}

// This only detects legacy payloads; decoded claims never authorize a user.
function tokenHasInlineAvatar(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return hasInlineAvatar(JSON.parse(atob(payload)).user_metadata);
  } catch {
    return false;
  }
}

const pending = new WeakMap<SupabaseClient, { userId: string; promise: Promise<User> }>();

/** Call with a user verified by getUser(), outside onAuthStateChange callbacks. */
export async function repairLegacyAvatarSession(client: SupabaseClient, user: User): Promise<User> {
  const current = pending.get(client);
  if (current?.userId === user.id) return current.promise;

  const promise = (async () => {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const inlineUser = hasInlineAvatar(user.user_metadata);
    const inlineToken = tokenHasInlineAvatar(data.session?.access_token || "");
    if (!inlineUser && !inlineToken) return user;

    if (inlineUser) {
      const { error: updateError } = await client.auth.updateUser({ data: { avatar_url: null } });
      if (updateError) throw updateError;
    }
    // updateUser saves the user but keeps the old access token. Reissue the JWT
    // before any navigation or response can carry its old base64 metadata.
    const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
    if (refreshError) throw refreshError;
    if (!refreshed.session || !refreshed.user ||
        tokenHasInlineAvatar(refreshed.session.access_token)) {
      throw new Error("Sesi belum berhasil diperbarui. Silakan masuk kembali.");
    }
    return refreshed.user;
  })();
  pending.set(client, { userId: user.id, promise });
  try {
    return await promise;
  } finally {
    if (pending.get(client)?.promise === promise) pending.delete(client);
  }
}
