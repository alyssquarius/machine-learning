import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { NextRequest } from "next/server.js";

const moduleURL = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const hygieneURL = moduleURL(stripTypeScriptTypes(await readFile(new URL("../lib/supabase/session-hygiene.ts", import.meta.url), "utf8")));
const configURL = moduleURL(stripTypeScriptTypes(await readFile(new URL("../lib/supabase/config.ts", import.meta.url), "utf8")));
async function loadModule(path, replacements) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [before, after] of replacements) source = source.replace(before, after);
  return import(moduleURL(stripTypeScriptTypes(source)));
}
const { updateSession } = await loadModule("../lib/supabase/middleware.ts", [
  ['import { createServerClient } from "@supabase/ssr";', 'const createServerClient = (...args) => globalThis.authFixture.createServerClient(...args);'],
  ['"next/server"', JSON.stringify(import.meta.resolve("next/server.js"))],
  ['"./config"', JSON.stringify(configURL)],
  ['"./session-hygiene"', JSON.stringify(hygieneURL)],
]);
const { GET } = await loadModule("../app/auth/callback/route.ts", [
  ['import { createClient } from "@/lib/supabase/server";', 'const createClient = async () => globalThis.authFixture.client;'],
  ['"next/server"', JSON.stringify(import.meta.resolve("next/server.js"))],
  ['"@/lib/supabase/config"', JSON.stringify(configURL)],
  ['"@/lib/supabase/session-hygiene"', JSON.stringify(hygieneURL)],
]);
const { getSupabaseConfig } = await import(configURL);
const saved = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";

function fixture({ user = null, role = "buyer", fail = false, sessionError = null } = {}) {
  const state = { writes: [], options: null };
  const client = {
    auth: {
      async getUser() {
        state.options?.cookies.setAll([{ name: "sb-test-auth-token", value: "refreshed", options: { httpOnly: true, path: "/" } }]);
        if (fail) throw new Error("Auth unavailable");
        return { data: { user } };
      },
      async getSession() { return { data: { session: { access_token: "normal-token" } }, error: null }; },
      async exchangeCodeForSession() { return { error: sessionError }; },
      async updateUser() { return { error: null }; },
    },
    from() {
      return {
        select() { return { eq() { return { async maybeSingle() { return { data: role ? { role } : null }; } }; } }; },
        async upsert(value, options) { state.writes.push({ value, options }); return { error: null }; },
      };
    },
  };
  globalThis.authFixture = {
    client,
    createServerClient(_url, _key, options) { state.options = options; return client; },
  };
  return state;
}
const request = (path) => new NextRequest(`https://autobuycars.example${path}`);
const user = { id: "user-1", email: "admin@autobuycars.com", user_metadata: {} };

test("public catalogue remains accessible without authentication", async () => {
  fixture(); assert.equal((await updateSession(request("/beli"))).status, 200);
});
test("protected pages redirect guests and keep refreshed cookies", async () => {
  for (const path of ["/jual", "/dashboard", "/favorit", "/riwayat", "/profil", "/pengaturan"]) {
    fixture(); const response = await updateSession(request(path));
    assert.equal(response.headers.get("location"), "https://autobuycars.example/login");
    assert.equal(response.cookies.get("sb-test-auth-token")?.value, "refreshed");
  }
});
test("an authenticated user can open password recovery and verification", async () => {
  fixture({ user });
  for (const path of ["/reset-password", "/verify-email", "/forgot-password"]) {
    assert.equal((await updateSession(request(path))).status, 200);
  }
});
test("email address alone does not grant admin access", async () => {
  fixture({ user, role: "buyer" });
  assert.equal((await updateSession(request("/dashboard"))).headers.get("location"), "https://autobuycars.example/beli");
});
test("dealers land on dashboard and redirects preserve session refresh", async () => {
  fixture({ user, role: "dealer" }); const response = await updateSession(request("/login"));
  assert.equal(response.headers.get("location"), "https://autobuycars.example/dashboard");
  assert.equal(response.cookies.get("sb-test-auth-token")?.value, "refreshed");
});
test("auth outage keeps public pages usable and blocks protected pages", async () => {
  fixture({ fail: true });
  assert.equal((await updateSession(request("/beli"))).status, 200);
  assert.equal((await updateSession(request("/profil"))).status, 307);
});
test("OAuth callback bypasses proxy session lookup", async () => {
  fixture({ fail: true }); assert.equal((await updateSession(request("/auth/callback?code=test"))).status, 200);
});
test("OAuth preserves existing dealer role instead of replacing it", async () => {
  const state = fixture({ user, role: "dealer" });
  const response = await GET(request("/auth/callback?code=test"));
  assert.equal(response.headers.get("location"), "https://autobuycars.example/dashboard");
  assert.equal(state.writes.length, 0);
});
test("new OAuth accounts get buyer profile without overwriting duplicates", async () => {
  const state = fixture({ user, role: null });
  await GET(request("/auth/callback?code=test"));
  assert.equal(state.writes[0].value.role, "buyer");
  assert.equal(state.writes[0].options.ignoreDuplicates, true);
});
test("invalid OAuth code reports an error on login", async () => {
  fixture({ user, sessionError: new Error("expired") });
  assert.equal((await GET(request("/auth/callback?code=expired"))).headers.get("location"), "https://autobuycars.example/login?error=auth_callback");
});
test("missing/invalid deployment configuration does not crash public pages", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  for (const invalid of ["", "invalid", "javascript:alert(1)"]) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = invalid;
    assert.equal(getSupabaseConfig(), null);
    assert.equal((await updateSession(request("/beli"))).status, 200);
    assert.equal((await updateSession(request("/profil"))).status, 307);
    assert.equal((await GET(request("/auth/callback?code=test"))).status, 307);
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
});
test.after(() => {
  for (const [name, value] of [["NEXT_PUBLIC_SUPABASE_URL", saved.url], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", saved.key]]) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
  delete globalThis.authFixture;
});

test("profile response preserves obsolete cookie deletions across update and refresh", async () => {
  const legacyUser = { ...user, user_metadata: { avatar_url: "data:image/png;base64,legacy" } };
  const state = fixture({ user: legacyUser });
  const client = globalThis.authFixture.client;
  client.auth.getSession = async () => ({ data: { session: { access_token: "legacy-token" } }, error: null });
  client.auth.updateUser = async () => {
    state.options.cookies.setAll([{ name: "sb-old-token.0", value: "", options: { maxAge: 0, path: "/" } }]);
    return { error: null };
  };
  client.auth.refreshSession = async () => {
    state.options.cookies.setAll([
      { name: "sb-old-token.1", value: "", options: { maxAge: 0, path: "/" } },
      { name: "sb-test-auth-token", value: "compact", options: { path: "/" } },
    ]);
    return { data: { user, session: { access_token: "compact-token" } }, error: null };
  };
  const response = await updateSession(request("/profil"));
  assert.equal(response.status, 200);
  assert.equal(response.cookies.get("sb-old-token.0")?.maxAge, 0);
  assert.equal(response.cookies.get("sb-old-token.1")?.maxAge, 0);
  assert.equal(response.cookies.get("sb-test-auth-token")?.value, "compact");
});
