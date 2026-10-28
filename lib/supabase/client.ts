import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Layanan akun belum dikonfigurasi. Hubungi pengelola website.");
  }
  return createBrowserClient(config.url, config.key, {
    cookies: { encode: "tokens-only" },
  });
}
