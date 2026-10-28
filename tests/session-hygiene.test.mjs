import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createBrowserClient } from "@supabase/ssr";

const source = stripTypeScriptTypes(
  await readFile(new URL("../lib/supabase/session-hygiene.ts", import.meta.url), "utf8"),
);
const { repairLegacyAvatarSession } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const avatar = `data:image/png;base64,${"A".repeat(24000)}`;
const makeUser = (avatarUrl) => ({ id: "legacy-user", user_metadata: { avatar_url: avatarUrl } });
const token = (metadata) =>
  [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(
      JSON.stringify({ sub: "legacy-user", exp: 4102444800, user_metadata: metadata }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");

function fixture({
  inlineUser = true,
  inlineToken = true,
  updateError = null,
  refreshError = null,
  refreshStillInline = false,
} = {}) {
  const user = makeUser(inlineUser ? avatar : "https://example.com/avatar.png");
  const calls = [];
  let jwt = token({ avatar_url: inlineToken ? avatar : null });
  const client = {
    auth: {
      async getSession() {
        return { data: { session: { access_token: jwt } }, error: null };
      },
      async updateUser() {
        calls.push("update");
        // Supabase updateUser changes the user, not the issued JWT.
        if (!updateError) user.user_metadata.avatar_url = null;
        return { data: { user }, error: updateError };
      },
      async refreshSession() {
        calls.push("refresh");
        if (!refreshError) jwt = token({ avatar_url: refreshStillInline ? avatar : null });
        return { data: { user, session: { access_token: jwt } }, error: refreshError };
      },
    },
  };
  return { client, user, calls, getJWT: () => jwt };
}

test("legacy inline avatar is removed and its previously issued JWT replaced", async () => {
  const f = fixture();
  const before = f.getJWT().length;
  await repairLegacyAvatarSession(f.client, f.user);
  assert.deepEqual(f.calls, ["update", "refresh"]);
  assert.equal(f.user.user_metadata.avatar_url, null);
  assert.ok(f.getJWT().length < before / 10);
});
test("a stale JWT is refreshed even when user metadata has already been cleaned", async () => {
  const f = fixture({ inlineUser: false });
  await repairLegacyAvatarSession(f.client, f.user);
  assert.deepEqual(f.calls, ["refresh"]);
});
test("normal remote avatars and healthy sessions do not trigger Auth writes", async () => {
  const f = fixture({ inlineUser: false, inlineToken: false });
  assert.equal(await repairLegacyAvatarSession(f.client, f.user), f.user);
  assert.deepEqual(f.calls, []);
});
test("cleanup errors stop navigation instead of silently keeping a bloated session", async () => {
  const f = fixture({ updateError: new Error("update failed") });
  await assert.rejects(repairLegacyAvatarSession(f.client, f.user), /update failed/);
  assert.deepEqual(f.calls, ["update"]);
});
test("a failed refresh or still bloated replacement is not reported as repaired", async () => {
  const f = fixture({ refreshError: new Error("refresh failed") });
  await assert.rejects(repairLegacyAvatarSession(f.client, f.user), /refresh failed/);
  const g = fixture({ refreshStillInline: true });
  await assert.rejects(repairLegacyAvatarSession(g.client, g.user), /Sesi belum berhasil/);
});
test("simultaneous callers share one legacy cleanup and refresh", async () => {
  const f = fixture();
  await Promise.all([
    repairLegacyAvatarSession(f.client, f.user),
    repairLegacyAvatarSession(f.client, f.user),
  ]);
  assert.deepEqual(f.calls, ["update", "refresh"]);
});

test("real Supabase SSR SDK removes legacy cookie chunks after token refresh", async () => {
  const jar = new Map();
  const user = makeUser(avatar);
  const client = createBrowserClient("https://example.supabase.co", "public-test-key", {
    isSingleton: false,
    cookies: {
      encode: "tokens-only",
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll(cookies) {
        for (const { name, value } of cookies) {
          if (!value) jar.delete(name);
          else jar.set(name, value);
        }
      },
    },
    global: {
      fetch: async (input, options) => {
        const url = String(input);
        if (url.includes("/token")) {
          return Response.json({
            access_token: token(user.user_metadata),
            refresh_token: "test-refresh",
            token_type: "bearer",
            expires_in: 3600,
            user,
          });
        }
        if (options?.method === "PUT") user.user_metadata.avatar_url = null;
        return Response.json(user);
      },
    },
  });
  const { error } = await client.auth.setSession({
    access_token: token(user.user_metadata),
    refresh_token: "test-refresh",
  });
  assert.equal(error, null);
  const before = Array.from(jar.values()).join("").length;
  const oldChunks = jar.size;
  await repairLegacyAvatarSession(client, user);
  const after = Array.from(jar.values()).join("").length;
  assert.ok(oldChunks > 3, "test starts with a fragmented oversized auth cookie");
  assert.ok(after < before / 10, "refreshed cookies no longer contain the inline avatar");
  assert.equal(jar.size, 1, "obsolete numbered cookie chunks are removed");
  client.auth.stopAutoRefresh();
});
