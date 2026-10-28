import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { repairLegacyAvatarSession } from "./session-hygiene";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const matches = (paths: string[]) => paths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  const protectedPage = matches(["/jual", "/dashboard", "/favorit", "/riwayat", "/pengaturan", "/profil", "/chat"]);
  // Recovery and email verification must remain accessible with an active session.
  const signInPage = matches(["/login", "/register"]);
  const config = getSupabaseConfig();

  function redirect(path: string) {
    const destination = request.nextUrl.clone();
    destination.pathname = path;
    destination.search = "";
    const redirected = NextResponse.redirect(destination);
    // Preserve refreshed/removed session cookies across redirects.
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  if (!config) return protectedPage ? redirect("/login") : response;
  // The PKCE callback needs the original verifier cookies; it exchanges its own session.
  if (pathname === "/auth/callback") return response;
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      encode: "tokens-only",
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) user = await repairLegacyAvatarSession(supabase, user);
  } catch {
    // Public catalogue stays available during an authentication outage.
    return protectedPage ? redirect("/login") : response;
  }

  if (!user) return protectedPage ? redirect("/login") : response;

  if (signInPage || matches(["/dashboard", "/jual"])) {
    const { data: profile } = await supabase.from("profiles")
      .select("role").eq("id", user.id).maybeSingle();
    const seller = ["admin", "dealer"].includes(profile?.role);
    if (signInPage) return redirect(seller ? "/dashboard" : "/beli");
    if (!seller) return redirect("/beli");
  }
  return response;
}
